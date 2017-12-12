/* jshint esversion: 6 */
///////////////////////////////////////////////////////////////////////////////
//// Initial Set Up ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const width = 960,
			height = 600;

const colors = [
	{ text: "Dead", color: "#EF8A62" },
	{ text: "Survived", color: "#67A9CF"}
];

const color = d3.scaleOrdinal()
		.domain([0, 1])
		.range(colors.map(d => d.color));

const svg = d3.select("#svg").append("svg")
		.attr("width", width)
		.attr("height", height);

const backgroundRect = svg.append("rect") // Capture clicks to de-heightlight selected bubble
		.attr("width", width)
		.attr("height", height)
		.attr("x", 0)
		.attr("y", 0)
		.attr("fill", "none")
		.style("pointer-events", "all");

///////////////////////////////////////////////////////////////////////////////
//// Data /////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

d3.csv("data/titanic-data.csv", processData);

function processData(error, data) {
	if (error) throw error;
	bubbleChart(data);
}

///////////////////////////////////////////////////////////////////////////////
//// Bubble Chart /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function bubbleChart(data) {
	// Bubble radius
	const radius = 5;

	// Constants for force layout
	const forceStrength = 0.05;

	// Create force layout
	const simulation = d3.forceSimulation()
			.velocityDecay(0.2)
			.force("x", d3.forceX().strength(forceStrength).x(width / 2))
			.force("y", d3.forceY().strength(forceStrength).y(height / 2))
			.force("charge", d3.forceManyBody().strength(d => -Math.pow(radius, 2) * forceStrength * 2)) // Prevent circles from overlapping
			.on("tick", ticked);

	// Stop auto force starting because there aren't any node yet.
	simulation.stop();

	// Convert data into nodes
	const nodes = createNodes(data);

	// Bound nodes data to bubbles
	const bubbles = svg.selectAll(".bubble")
		.data(nodes, d => d.id)
		.enter().append("circle")
			.attr("class", "bubble")
			.attr("r", 0)
			.attr("fill", d => color(d.survived))
			.on("click", highlightBubble)
			.on("mouseover", showTooltip)
			.on("mouseout", hideTooltip);

	// Bubbles appear
	bubbles.transition()
			.duration(2000)
			.attr("r", radius);

	// The simulation auto starts after setting the nodes
	simulation.nodes(nodes);
	// Reset the alpha value and restart the simulation
	simulation.alpha(1).restart();

	// Click the background to de-highlight selected bubble
	backgroundRect.on("click", dehighlightBubble);

	function createNodes(data) {
		return data.map(d => ({
			id: d.PassengerId,
			survived: +d.Survived, // 0: dead, 1: survived
			name: d.Name,
			gender: d.Sex, // male, female
			class: +d.Pclass, // 1: 1st class, 2: 2nd class, 3: 3rd class
			age: d.Age === "" ? null : +d.Age,
			sibSp: +d.SibSp, // Number of siblings and spouse on board
			parCh: +d.ParCh, // Number of parents and children on board
			x: Math.random() * width,
			y: Math.random() * height
		}));
	}

	function ticked() {
		bubbles
				.attr("cx", d => d.x)
				.attr("cy", d => d.y);
	}

	/////////////////////////////////////////////////////////////////////////////
	//// Legend /////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////
	const legendRowHeight = 20;
	const legend = svg.append("g")
			.attr("id", "legend")
			.attr("transform", "translate(860, 30)")
		.selectAll("g")
		.data(colors)
		.enter()
		.append("g")
			.attr("transform", (d, i) => `translate(0, ${i * legendRowHeight})`);
	legend.append("circle")
			.attr("cx", 10)
			.attr("cy", legendRowHeight / 2)
			.attr("r", radius)
			.attr("fill", d => d.color);
	legend.append("text")
			.attr("x", 20)
			.attr("y", legendRowHeight / 2)
			.attr("text-anchor", "start")
			.style("alignment-baseline", "central")
			.text(d => d.text);

	/////////////////////////////////////////////////////////////////////////////
	// Bubble Highlight /////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////

	function highlightBubble() {
		d3.selectAll(".bubble")
			.transition()
				.attr("fill", "#CCC");
		d3.select(this)
			.transition()
				.attr("fill", d => color(d.survived));
	}

	function dehighlightBubble() {
		d3.selectAll(".bubble")
			.transition()
				.attr("fill", d => color(d.survived));
	}

	/////////////////////////////////////////////////////////////////////////////
	// Tooltip //////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////
	const tooltip = d3.select("body")
		.append("div")
			.attr("id", "tooltip")
			.style("position", "absolute");

	function showTooltip(d) {
		tooltip.transition()
				.style("opacity", 1);
		tooltip.style("left", (d3.event.pageX + 10) + "px")
				.style("top", (d3.event.pageY + 10) + "px")
				.html(
					'<span class="tooltip-name">Name: </span><span id="passenger-name" class="tooltip-value">' + d.name + '</span><br/>' +
					'<span class="tooltip-name">Survived: </span><span class="tooltip-value">' + (d.survived === 0 ? "no" : "yes") + '</span><br/>' +
					'<span class="tooltip-name">Gender: </span><span class="tooltip-value">' + d.gender + '</span><br/>' +
					'<span class="tooltip-name">Class: </span><span class="tooltip-value">' + d.class + '</span><br/>' +
					'<span class="tooltip-name">Age: </span><span class="tooltip-value">' + d.age + '</span><br/>' +
					'<span class="tooltip-name">Siblings/Spouse: </span><span class="tooltip-value">' + d.sibSp + '</span><br/>' +
					'<span class="tooltip-name">Parents/Children: </span><span class="tooltip-value">' + d.parCh + '</span>'
				);
		tooltip.select("#passenger-name")
				.style("color", color(d.survived));
	}

	function hideTooltip() {
		tooltip.transition()
			.style("opacity", 0);
	}

	/////////////////////////////////////////////////////////////////////////////
	// Split Bubbles by Categories //////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////

	// Force centers
	const survivedCenters = [
		{ y: height / 9 * 4, display: "Dead" },
		{ y: height / 9 * 5, display: "Survived" }
	];
	const genderCenters = [
		{ x: width / 3, display: "Male" },
		{ x: width / 3 * 2, display: "Female" }
	];
	const classCenters = [
		{ x: width / 4, display: "1st Class" },
		{ x: width / 4 * 2, display: "2nd Class" },
		{ x: width / 4 * 3, display: "3rd Class" }
	];
	const ageCenters = [
		{ x: width / 5, display: "Not Provided"},
		{ x: width / 5 * 2, display: "Less Than 10"},
		{ x: width / 5 * 3, display: "Between 10 And 60"},
		{ x: width / 5 * 4, display: "Greater Than 60"}
	];
	const sibSpCenters = [
		{ x: width / 6 * 1.5, display: "No Sibling/Spouse"},
		{ x: width / 6 * 3, display: "1"},
		{ x: width / 6 * 4, display: "2"},
		{ x: width / 6 * 5, display: "3 Or More"}
	];
	const parChCenters = [
		{ x: width / 6 * 1.5, display: "0 Parent/Child"},
		{ x: width / 6 * 3, display: "1"},
		{ x: width / 6 * 4, display: "2"},
		{ x: width / 6 * 5, display: "3 Or More"}
	];

	// Get force centers x positions
	function getSurvivedCenters(d) {
		return survivedCenters[d.survived].y;
	}
	function getGenderCenters(d){
		if (d.gender === "male") { // Male
			return genderCenters[0].x;
		} else { // Female
			return genderCenters[1].x;
		}
	}
	function getClassCenters(d) {
		return classCenters[d.class - 1].x;
	}
	function getAgeCenters(d) {
		if (d.age === null) { // Age is missing in original data
				return ageCenters[0].x;
			} else if (d.age < 10) { // Age < 10
				return ageCenters[1].x;
			} else if (d.age < 60) { // 10 <= Age < 60
				return ageCenters[2].x;
			} else { // Age >= 60
				return ageCenters[3].x;
			}
	}
	function getSibSpCenters(d) {
		if (d.sibSp === 0) { // No sibling or spouse
				return sibSpCenters[0].x;
			} else if (d.sibSp === 1) { // 1 sibling or spouse
				return sibSpCenters[1].x;
			} else if (d.sibSp === 2) { // 2 siblings or spouse
				return sibSpCenters[2].x;
			} else { // More than 2 siblings or spouse
				return sibSpCenters[3].x;
			}
	}
	function getParChCenters(d) {
		if (d.parCh === 0) { // No parent or child
				return parChCenters[0].x;
			} else if (d.parCh === 1) { // 1 parent or child
				return parChCenters[1].x;
			} else if (d.parCh === 2) { // 2 parents or children
				return parChCenters[2].x;
			} else { // More than 2 parents or children
				return parChCenters[3].x;
			}
	}

	// Category titles
	const titlesG = svg.append("g")
			.attr("id", "titles");

	function updateTitles(data) {
		// UPDATE
		const titles = titlesG.selectAll("text")
		.data(data);
		// EXIT
		titles.exit()
				.remove();
		// ENTER
		titles.enter()
		.append("text")
			.attr("class", "title")
			.attr("text-anchor", "middle")
			.attr("y", 50)
		// ENTER + UPDATE
		.merge(titles)
			.attr("x", d => d.x)
			.text(d => d.display);
	}
	// Inital titles
	updateTitles([{ x: width / 2, display: "Use above control to split passengers or click any dot below to heiglight an individual passenger"}]);

	// Split bubbles
	function splitBySurvived(checked) {
		if (checked) {
			simulation.force("y", d3.forceY().strength(forceStrength).y(getSurvivedCenters));
		} else {
			simulation.force("y", d3.forceY().strength(forceStrength).y(height / 2));
		}
		simulation.alpha(1).restart();
	}

	function splitByGender() {
		simulation.force("x", d3.forceX().strength(forceStrength).x(getGenderCenters));
		simulation.alpha(1).restart();
		updateTitles(genderCenters);
	}

	function splitByClass() {
		simulation.force("x", d3.forceX().strength(forceStrength).x(getClassCenters));
		simulation.alpha(1).restart();
		updateTitles(classCenters);
	}

	function splitByAge() {
		simulation.force("x", d3.forceX().strength(forceStrength).x(getAgeCenters));
		simulation.alpha(1).restart();
		updateTitles(ageCenters);
	}

	function splitBySibSp() {
		simulation.force("x", d3.forceX().strength(forceStrength).x(getSibSpCenters));
		simulation.alpha(1).restart();
		updateTitles(sibSpCenters);
	}

	function splitByParCh() {
		simulation.force("x", d3.forceX().strength(forceStrength).x(getParChCenters));
		simulation.alpha(1).restart();
		updateTitles(parChCenters);
	}

	/////////////////////////////////////////////////////////////////////////////
	// Controls /////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////

	d3.select("#buttons")
		.selectAll(".button")
			.on("click", function() {
				// Remove active class from all buttons
				d3.selectAll(".button")
						.classed("active", false);
				// Set the button just clicked to active
				const button = d3.select(this)
						.classed("active", true);
				// Split bubbles depending on the field
				switch (button.attr("id")) {
					case "gender-button":
						splitByGender();
						break;
					case "class-button":
						splitByClass();
						break;
					case "age-button":
						splitByAge();
						break;
					case "sibsp-button":
						splitBySibSp();
						break;
					case "parch-button":
						splitByParCh();
				}
			});

	d3.select("#survived-checkbox")
			.on("change", function() {
				const checked = this.checked;
				splitBySurvived(checked);
			});
}
