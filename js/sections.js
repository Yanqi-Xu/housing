//import * as d3 from "../node_modules/d3-selection/dist/d3-selection.js";
// using d3 for convenience, and storing a selected elements
const $container = d3.select('#container');
const $graphic = d3.select('.scroll__graphic');
const $chart = d3.select('.chart');
const $text = d3.select('.scroll__text');
const $step = d3.selectAll('.step');

const scroller = scrollama();

let inputValue = 0;
let year = ["2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018"];

const activateFunction = [];


// Width and Height of the whole visualization
//changed from 600
const width = 800;
const height = 520;

// Create SVG
const svg = $chart
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const color = d3.scaleQuantize([0, 10], d3.schemeBlues[9]);
// Append empty placeholder g element to the SVG
// g will contain geometry elements
const g = svg.append("g")


$graphic
    .append('div')
    .attr('id', 'tooltip')
    .attr('style', 'position: absolute; opacity: 0;');

d3.select("#rate").html(
    "Year: " + year[year.length - 1]
);

const width_slider = 920;
const height_slider = 50;


Promise.all([
    d3.csv('../data/ct_appeals.csv'),
    d3.json('../shapefiles/ct_towns.json')
]).then(([csvData, ct]) => {
    const topo = ct.features[0];
    const topoTown = topojson.feature(topo, topo.objects.ct_towns);
    const towns = topoTown.features;
    var albersProjection = d3.geoTransverseMercator()
        .rotate([72.057, 41.513])
        .fitExtent([
            [10, 10],
            [height - 10, width - 10]
        ], topoTown);

    const geoPath = d3.geoPath()
        .projection(albersProjection);

    function yearSelector(i) {
        const appeals = csvData.reduce((accumulator, d) => {
            accumulator[d.town] = +d[year[i]]
            return accumulator;
        }, {});
        return appeals
    }

    // when the input range changes update the value 
    d3.select("#timeslide").on("input", function () {
        update(+this.value);
        tooltipUpdate(+this.value)
    });


    // update the color of each town
    function update(value) {
        document.getElementById("range").innerHTML = year[value];
        inputValue = year[value];
        d3.selectAll(".towns")
            .attr("fill", data => {
                return color(yearSelector(value)[data.properties.town])
            });
    }

    function tooltipUpdate(value) {
        d3.selectAll("path")
            .on('mouseover', d => d3.select('#tooltip')
                .transition()
                .duration(200)
                .style('opacity', 1)
                .text(d.properties.town + ", " + yearSelector(value)[d.properties.town] + "% of housing units are available at affordable rate"))
    }

    inputValue = document.getElementById("range").value
    g.selectAll('path')
        .data(towns)
        .join('path')
        .attr("class", "towns")
        .attr('opacity', 0)
        .attr('d', geoPath)
        .attr('fill', data => {
            return color(yearSelector(0)[data.properties.town])
        })
        .on('mouseover', d => d3.select('#tooltip').transition().duration(200).style('opacity', 1).text(d.properties.town + ",\n Total percentage of affordable housing: " + yearSelector(0)[d.properties.town] + "%"))
        .on('mousemove', d => d3.select('#tooltip').style('left', (d3.event.pageX + 10) + 'px').style('top', (d3.event.pageY + 10) + 'px'))
        .on('mouseout', d => d3.select('#tooltip').style('opacity', 0));

    svg.append("path")
        .datum(topojson.mesh(topo, topo.objects.ct_towns, (a, b) => a !== b))
        .attr('fill', "none")
        .attr('stroke', 'white')
        .attr('opacity', 1)
        .attr("d", geoPath);
});

const margin = {
    top: 10,
    right: 30,
    bottom: 30,
    left: 60
}

const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;

const plot = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

d3.csv('../data/ct_2018.csv').then((scatterData) => {
    //scale the range  

    scatterData.forEach((d) => {
        d.income = +d.income;
        d.afford_percent = +d.afford_percent / 100;
    })

    const xScale = d3.scaleLinear().domain([0, d3.max(scatterData, d => d.income)])
        .range([0, plotWidth]);

    const yScale = d3.scaleLinear().domain([0, d3.max(scatterData, d => d.afford_percent)])
        .range([plotHeight, 0]);

    // add the axies
    //digit specifies fix points
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format('.0s'));
    const yAxis = d3.axisLeft(yScale).tickFormat(d3.format('.0%'));

    plot.append('g')
        .attr('class', 'x_axis')
        .attr('transform', `translate(0,${plotHeight})`)
        .call(xAxis);

    plot.append('g')
        .attr('class', 'y_axis')
        .call(yAxis)
        //separate the two axes
        .attr('padding', 0.1);

    g.selectAll("circle")
        .data(scatterData)
        .join("circle")
        .attr("cx", function (d) {
            return xScale(d.income)
        })
        .attr("cy", function (d) {
            return yScale(d.afford_percent)
        })
        .attr('r', 4)
        .attr("fill", "red")
        .on("mouseover", function (d) {
            d3.select(this)
                .attr("stroke", "black")
                .attr('opacity', .7)
            div.transition()
                .duration(200)
                .style("opacity", .9)
                .style("stroke", "black")
            div.html("This is" + " " + "<strong>" + d.state + "</strong>" + ", where " + d3.round(d.ownership, 2) + "% of people own firearms." +
                    "</br>" + Math.round(d.death) + " out of 100,000 people die from guns.")
                .style("left", xScale(d.ownership) + 'px')
                .style("top", yScale(d.death) + margin.top - 20 + 'px');
        })
        .on("mouseout", function (d) {
            d3.select(this)
                .attr("stroke", "none")
                .attr('opacity', 1)
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });;
})

function init() {
    // 1. call a resize on load to update width/height/position of elements
    handleResize();

    // 2. setup the scrollama instance
    // 3. bind scrollama event handlers (this can be chained like below)
    scroller
        .setup({
            container: '#container', // our outermost scrollytelling element
            graphic: '.scroll__graphic', // the graphic
            text: '.scroll__text', // the step container
            step: '.scroll__text .step', // the step elements
            offset: 0.5, // set the trigger to be 1/2 way down screen
            debug: true, // display the trigger offset for testing
        })
        .onStepEnter(handleStepEnter)
        .onContainerEnter(handleContainerEnter)
        .onContainerExit(handleContainerExit);

    // setup resize event
    window.addEventListener('resize', handleResize);
}

// resize function to set dimensions on load and on page resize
function handleResize() {
    // 1. update height of step elements for breathing room between steps
    const stepHeight = Math.floor(window.innerHeight * 0.4);
    $step.style('height', stepHeight + 'px');

    // 2. update height of graphic element
    const bodyWidth = d3.select('body').node().offsetWidth;

    $graphic
        .style('height', window.innerHeight + 'px');

    // 3. update width of chart by subtracting from text width
    const chartMargin = 32;
    const textWidth = $text.node().offsetWidth;
    const chartWidth = $graphic.node().offsetWidth - textWidth - chartMargin;
    // make the height 1/2 of viewport
    const chartHeight = Math.floor(window.innerHeight / 2);

    $chart
        .style('width', chartWidth + 'px')
        .style('height', chartHeight + 'px');

    // 4. tell scrollama to update new element dimensions
    scroller.resize();
}


activateFunction[0] = showMap;

function showMap() {
    g.selectAll('path')
        .transition()
        .duration(300)
        .attr('opacity', 1);
}

// scrollama event handlers
function handleStepEnter(response) {
    // response = { element, direction, index }
    console.log(response.index)

    showMap();

    // fade in current step
    $step.classed('is-active', function (d, i) {
        return i === response.index;
    })
    // update graphic based on step here
    const stepData = $step.attr('data-step')
}

function handleContainerEnter(response) {
    // response = { direction }

    // sticky the graphic
    $graphic.classed('is-fixed', true);
    $graphic.classed('is-bottom', false);
}

function handleContainerExit(response) {
    // response = { direction }

    // un-sticky the graphic, and pin to top/bottom of container
    $graphic.classed('is-fixed', false);
    $graphic.classed('is-bottom', response.direction === 'down');
}


// start it up
init();