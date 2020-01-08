//import * as d3 from "../node_modules/d3-selection/dist/d3-selection.js";
// using d3 for convenience, and storing a selected elements
const $container = d3.select('.container');
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

const margin = {
    top: 10,
    right: 30,
    bottom: 45,
    left: 60
}

const burden = $chart.append('g')
    .attr("class", "burden")
    .style('opacity', '0')

burden.append('div')
    .attr('class', 'bar');
burden.append('div')
    .attr('class', 'outline');
burden.append('div')
    .attr('class', 'hline')

burden.append('div')
.attr('class','barnote')
    .text(`Spending more than 30% of income is considered housing-burdened`)

function barAnimation() {
    burden.select('.hline')
        .transition()
        .duration(500)
        .style('border-top', '2px dashed black')
        .ease('sin-in')
        .transition()
        .duration(300)
        .attr('border-top', '2px dashed red')
        .ease('bounce-in');
}

// Create SVG
const svg = $chart
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const color = d3.scaleQuantize([0, 20], d3.schemeBlues[9]);
// Append empty placeholder g element to the SVG
// g will contain geometry elements
const g = svg.append("g")


d3.select("body")
    .append('div')
    .attr('data-toggle', "tooltip")
    .attr('data-placement',"top")
    .attr('id', 'tooltip')
    .attr('style', 'position: absolute;')
//.style('background-color', 'rgba(30, 32, 32, 0)')
    .style('opacity', '0');

d3.select("#rate").html(
    "Year: " + year[year.length - 1]
);

const width_slider = 920;
const height_slider = 50;


Promise.all([
    d3.csv('https://raw.githubusercontent.com/Yanqi-Xu/housing/master/data/ct_appeals.csv'),
    d3.json('https://raw.githubusercontent.com/Yanqi-Xu/housing/master/shapefiles/ct_towns.json')
    //d3.csv('../data/ct_appeals.csv'),
    //d3.json('../shapefiles/ct_towns.json')
]).then(([csvData, ct]) => {
    const topo = ct.features[0];
    const topoTown = topojson.feature(topo, topo.objects.ct_towns);
    const towns = topoTown.features;

    var albersProjection = d3.geoAlbers()
        .scale(9000)
        .rotate([71.057, 0])
        .center([0, 42.313])
        //.translate( [width/2,height/2] )
        .fitExtent([
            [10, 10],
            [890, 510]
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
                //.style('background-color', 'rgba(30, 32, 32, 0)')
                .text(d.properties.town + ", " + yearSelector(value)[d.properties.town] + "% of housing units are available at affordable rate"))
    }

    inputValue = document.getElementById("range").value
    const map = g.selectAll('path')
        .data(towns)
        .join('path')
        .attr("class", "towns")
        .attr('opacity', 0)
        .attr('d', geoPath)
        .attr('fill', data => {
            return color(yearSelector(0)[data.properties.town])
        })

    map.on('mouseover', d => d3.select('#tooltip').transition().duration(200).style('opacity', 1).text(d.properties.town + ",\n Total percentage of affordable housing: " + yearSelector(0)[d.properties.town] + "%"))
        .on('mousemove', d => d3.select('#tooltip').style('left', (d3.event.pageX + 10) + 'px').style('top', (d3.event.pageY + 10) + 'px'))
        .on('mouseout', d => d3.select('#tooltip').style('opacity', 0));

    svg.append('path')
        .datum(topojson.mesh(topo, topo.objects.ct_towns, (a, b) => a !== b))
        .attr('fill', "none")
        .attr('stroke', 'white')
        .attr('opacity', 0)
        .attr("d", geoPath);

    function legend({
        color,
        title,
        tickSize = 6,
        width = 320,
        height = 44 + tickSize,
        marginTop = 18,
        marginRight = 0,
        marginBottom = 16 + tickSize,
        marginLeft = 0,
        ticks = width / 64,
        tickFormat,
        tickValues
    } = {}) {

        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .style("overflow", "visible")
            .style("display", "block");

        let x;

        // Continuous
        if (color.interpolator) {
            x = Object.assign(color.copy()
                .interpolator(d3.interpolateRound(marginLeft, width - marginRight)), {
                    range() {
                        return [marginLeft, width - marginRight];
                    }
                });

            svg.append("image")
                .attr("x", marginLeft)
                .attr("y", marginTop)
                .attr("width", width - marginLeft - marginRight)
                .attr("height", height - marginTop - marginBottom)
                .attr("preserveAspectRatio", "none")
                .attr("xlink:href", ramp(color.interpolator()).toDataURL());

            // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
            if (!x.ticks) {
                if (tickValues === undefined) {
                    const n = Math.round(ticks + 1);
                    tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
                }
                if (typeof tickFormat !== "function") {
                    tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
                }
            }
        }

        // Discrete
        else if (color.invertExtent) {
            const thresholds = color.thresholds ? color.thresholds() // scaleQuantize
                :
                color.quantiles ? color.quantiles() // scaleQuantile
                :
                color.domain(); // scaleThreshold

            const thresholdFormat = tickFormat === undefined ? d => d :
                typeof tickFormat === "string" ? d3.format(tickFormat) :
                tickFormat;

            x = d3.scaleLinear()
                .domain([-1, color.range().length - 1])
                .rangeRound([marginLeft, width - marginRight]);

            svg.append("g")
                .selectAll("rect")
                .data(color.range())
                .join("rect")
                .attr("x", (d, i) => x(i - 1))
                .attr("y", marginTop)
                .attr("width", (d, i) => x(i) - x(i - 1))
                .attr("height", height - marginTop - marginBottom)
                .attr("fill", d => d);

            tickValues = d3.range(thresholds.length);
            tickFormat = i => thresholdFormat(thresholds[i], i);
        }

        svg.append("g")
            .attr("transform", `translate(0, ${height - marginBottom})`)
            .call(d3.axisBottom(x)
                .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
                .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
                .tickSize(tickSize)
                .tickValues(tickValues))
            .call(g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height))
            .call(g => g.select(".domain").remove())
            .call(g => g.append("text")
                .attr("y", marginTop + marginBottom - height - 6)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .text(title));

        return svg.node();
    }

    svg.append("g")
        .attr("class", "legend")
        .attr('opacity', 0)
        .attr('transform', `translate(${width/2 + 100}, ${height-110})`)
        .append(() => legend({
            color,
            title: "share of affordable units (%)",
            width: 260,
            tickFormat: ".0f"
        }))

    /*         csvData.title = "Percentage of Affordable Housing Units"
            svg.append("g")
            .attr('class', 'legend')
            .attr("transform", "translate(610,20)")
            .style("font-size", '12px')
            .append(() => d3.legend({color, title: csvData.title, width: 260})); */
});

const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;

const plot = svg.append('g')
    .attr('class', 'scatter')
    .style('opacity', '0')
    .attr('transform', `translate(${margin.left},${margin.top})`)

d3.csv('https://raw.githubusercontent.com/Yanqi-Xu/housing/master/data/ct_2018.csv')
    .then((scatterData) => {
        //scale the range  

        const plotdiv = d3.select("body").append('div')
            .attr("class", "plotdiv")
            .attr('style', 'position: absolute;');

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

        const xAxisG = plot.append('g')
            .attr('class', 'x_axis')
            .attr('transform', `translate(0,${plotHeight})`)
            .call(xAxis);


        const yAxisG = plot.append('g')
            .attr('class', 'y_axis')
            .call(yAxis)
            //separate the two axes
            .attr('padding', 0.1);

        xAxisG.append('text')
            .attr('y', 32)
            .attr('x', plotWidth / 2)
            .text('Median Household Income')
            .attr('fill', 'black')

        plot.append('text')
            .attr('id', 'plotcaption')
            .attr('y', plotHeight)
            .attr('x', plotWidth / 2 + 50)
            .text("Source: T Dept. of Housing, ACS 2014-2018")

        yAxisG.append('text')
            .attr('y', 300)
            .attr('x', 300)
            .text('Rate of Affordable Units, %')
            .attr('fill', 'black')
            .attr('transform', 'rotate(90)');

        const circles = plot.selectAll("circle").data(scatterData);
        circles
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
                plotdiv.transition()
                    .duration(200)
                    .style("opacity", .9)
                    .style("stroke", "black");
                plotdiv.html("This is" + " " + "<strong>" + d.town + "</strong>" + ", where the median income is" + d3.format(",.2r")(d.income) +
                        ",</br>" + ` and ${d3.format(".0%")(d.afford_percent)}% of housing units are affordable.`)
                    .style('left', (d3.event.pageX + 10) + 'px')
                    .style('top', (d3.event.pageY + 10) + 'px');
                //.style("top", yScale(d.afford_percent) + margin.top - 20 + 'px');
            })
            .on("mouseout", function (d) {
                d3.select(this)
                    .attr("stroke", "none")
                    .attr('opacity', 1)
                plotdiv.transition()
                    .duration(500)
                    .style("opacity", 0);
            });;
        circles.exit().remove();
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
            debug: false, // display the trigger offset for testing
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


function showBar() {
    burden
        .transition()
        .duration(200)
        .style('opacity', 1)
    
    $('#tooltip').tooltip('hide')

    plot
        .style('opacity', 0);
}

function showPlot() {
    burden
        .transition()
        .duration(300)
        .style('opacity', 0);

    g
        .select('.hline')
        .transition()
        .duration(300)
        .style('fill', 'black')
        .transition()
        .duration(300)
        .style('fill', 'red')


    plot
        .transition()
        .delay(500)
        .duration(1000)
        .ease(d3.easeBounce)
        .style('opacity', 1);

    g.selectAll('.towns')
        .attr('opacity', 0);

    d3.select('#timeslide')
        .transition()
        .duration(300)
        .style('opacity', 0)

    d3.select('#range')
        .transition()
        .duration(300)
        .style('opacity', 0)

    d3.select('.legend')
        .transition()
        .duration(300)
        .style('opacity', 0)


}

/* activateFunction[1] = showBar();
activateFunction[2] = showPlot();
activateFunction[3] = showMap();


 */
function showMap() {
    plot
        .transition()
        .duration(600)
        .style('opacity', 0);

    g.selectAll('path')
        .transition()
        .delay(400)
        .duration(300)
        .attr('opacity', 1);

    d3.select('#timeslide')
        .transition()
        .delay(400)
        .duration(300)
        .style('opacity', 1)

    d3.select('#range')
        .transition()
        .delay(400)
        .duration(300)
        .style('opacity', 1)

    d3.select('.legend')
        .transition()
        .delay(500)
        .duration(300)
        .style('opacity', 1)


    /*     g.append("g")
        .attr("class", "legend")
        .style("font-size", "12px")
        .attr("transform", "translate(120,120)"); */

    /* const legend = d3.legendColor()
        .labelFormat(d3.format(".1f"))
        //.labelFormat(() => `${d3.format(".1f")()%}`)    
        .shapeWidth(30)
        .scale(color); */


    /*     d3.selectAll('#tooltip')
            .style('background-color', 'rgba(30, 32, 32, 0.34)'); */

    /*     plot
            .transition(600)
            .duration(300)
            .style('opacity', 1); */
}

// scrollama event handlers
function handleStepEnter(response) {
    // response = { element, direction, index }
    console.log(response.index)
    //plot.attr('opacity', '1')
    if (response.index == 0) {
        showBar();
    }
    if (response.index == 1) {
        showPlot();
    }
    if (response.index == 2) {
        showMap();
    }


    //barAnimation();
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

function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}