let inputValue = 0;
let year = ["2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018"];

// Width and Height of the whole visualization
const width = 700;
const height = 580;

// Create SVG
const svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
const color = d3.scaleQuantize([0, 10], d3.schemeBlues[9]);
// Append empty placeholder g element to the SVG
// g will contain geometry elements
const g = svg.append("g")

/*        g.attr("transform", 'translate(580,20)')
       .append(() => d3.legendColor({scale:color, title: "Percentage of Housing Units Affordable", width: 260}));
*/

// Width and Height of the whole visualization
// Set Projection Parameters
/* const albersProjection = d3.geoAlbers()
    .rotate([71.057, 0])
    .center([0, 42.313])
    .translate([width / 2, height / 2]); */


d3.select('body')
    .append('div')
    .attr('id', 'tooltip')
    .attr('style', 'position: absolute; opacity: 0;');

d3.select("#rate").html(
    "Year: " + year[year.length - 1]
);

const width_slider = 920;
const height_slider = 50;

Promise.all([
    d3.json('data/doc.json'),
    d3.csv('data/ct_appeals.csv'),
    d3.json('shapefiles/ct_towns.json')
]).then(([copy, csvData, ct]) => {
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
    //svg.append("g")
    /* const appeals = {};
        csvData.forEach(d => {
            console.log(d)
            appeals[d.town] = d.total_units
        }); */
    //console.log(csvData)
    //data = Object.assign(new Map(d3.csvParse(await FileAttachment("unemployment-x.csv").text(), ({id, rate}) => [id, +rate])), {title: "Unemployment rate (%)"})

    //for (let i = 0; i < csvData.length; i++) {

    /* appeals.title = "Affordable Housing Rate (%)";
    console.log(appeals) */

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


    // update the fill of each SVG of class "incident" with value
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
            .on('mouseover', d => d3.select('#tooltip').transition().duration(200).style('opacity', 1).text(d.properties.town + ",\n Total percentage of affordable housing: " + yearSelector(value)[d.properties.town] + "%"))
    }

    inputValue = document.getElementById("range").value
    g.selectAll('path')
        .data(towns)
        .join('path')
        .attr("class", "towns")
        .attr('d', geoPath)
        .attr('fill', data => {
            return color(yearSelector(0)[data.properties.town])
        })
        /* .attr('fill', d => color(function(d) {
            for (let i = 0; i < csvData.length; i++) {
                const appeals = csvData.reduce((accumulator, d) => {
                    accumulator[d.town] = +d[year]
                    return accumulator;
                }) */
        /*         const dataValue = csvData[i][year[year.length-1]];
                //console.log(dataValue)
                const townName = csvData[i].town;
                for (let j = 0; j < towns.length; j++) {
                  const jsonTown = towns[j].properties.town;
                  if (townName == jsonTown) {
                    towns[j].properties.percent_afford = dataValue;
                    console.log(towns[j].properties.percent_afford) */

        //.attr('fill', d => color(appeals[d.properties.town]))
        .on('mouseover', d => d3.select('#tooltip').transition().duration(200).style('opacity', 1).text(d.properties.town + ",\n Total percentage of affordable housing: " + yearSelector(0)[d.properties.town] + "%"))
        .on('mousemove', d => d3.select('#tooltip').style('left', (d3.event.pageX + 10) + 'px').style('top', (d3.event.pageY + 10) + 'px'))
        .on('mouseout', d => d3.select('#tooltip').style('opacity', 0));

    svg.append("path")
        .datum(topojson.mesh(topo, topo.objects.ct_towns, (a, b) => a !== b))
        .attr('fill', "none")
        .attr('stroke', 'white')
        .attr("d", geoPath);


});