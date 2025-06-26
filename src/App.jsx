import * as d3 from "d3"
import { useEffect, useRef } from "react"
import * as topojson from "topojson"
import "./App.css"

function App() {
  let toolTip = useRef()
  const svgAttr = {
    class: "svgHeatMap",
    margin: {
      top: 20,
      bottom: 0,
      left: 0,
      right: 0,
    }
  }

  const mapAttr = {
    width: 960,
    height: 560,
    margin: {
      top: 20,
      bottom: 60,
      left: 60,
      right: 20,
    }
  }

  useEffect(() => {
    d3.select(".svgContainer").selectAll("svg").remove()
    // svg conf
    const svg = d3
      .select(".svgContainer")
      .append("svg")
      .attr("width", mapAttr.width + mapAttr.margin.left + mapAttr.margin.right)
      .attr("height", mapAttr.height + mapAttr.margin.bottom + mapAttr.margin.top)
      .attr("class", svgAttr.class)
      .attr("style", `margin:${svgAttr.margin.top}px ${svgAttr.margin.right}px ${svgAttr.margin.bottom}px ${svgAttr.margin.left}px;`)
      .attr("style", "background-color:blue; border-radius:20px;")

    // g conf
    const g = svg.append("g").attr("transform", `translate(${mapAttr.margin.left},${mapAttr.margin.top})`)

    Promise.all([
      d3.json("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"),
      d3.json("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json")
    ]).then(([eduData, countryData]) => {

      // color scale
      const colorScale = d3.scaleSequential()
        .domain(d3.extent(eduData, row => row.bachelorsOrHigher))
        .interpolator(d3.interpolateCividis)

      render(eduData, countryData, colorScale)

    })

    function render(eduData, countryData, colorScale) {
      const countries = topojson.feature(countryData, countryData.objects.counties).features;

      g
        .selectAll("path")
        .data(countries)
        .enter()
        .append("path")
        .attr("d", d3.geoPath())
        .attr("class", "county")
        .attr("fill", d => {
          const ed = eduData.find(ed => ed.fips === d.id)
          return ed && colorScale(ed.bachelorsOrHigher)
        })
        .attr("data-fips", d => d.id)
        .attr("data-education", d => {
          let returner
          eduData.map(ed => {
            if (ed.fips == d.id) {
              returner = ed.bachelorsOrHigher
            }
          })
          return returner
        })
        .attr("countyName", d => {
          let returner
          eduData.map(ed => {
            if (ed.fips == d.id) {
              returner = ed.area_name
            }
          })
          return returner
        })
        .on("mouseover", (e, d) => {
          d3.select(e.currentTarget)
            .attr("data-highlighted", true)

          // tooltip
          d3.select(toolTip.current)
            .style("left", e.pageX + 20 + "px")
            .style("top", e.pageY + 20 + "px")
            .text(`County: ${e.target.attributes.countyName.value}, Bachelors or Higher: ${e.target.attributes[4].value}`)
            .attr("data-education", e.target.attributes[4].value)
            .transition()
            .duration(500)
            .attr("hidden", null)
            .style("opacity", 0.8)
        })
        .on("mouseout", (e, d) => {
          d3.select(e.currentTarget)
            .attr("data-highlighted", false)

          // tooltip
          d3.select(toolTip.current)
            .attr("hidden", "")
            .style("opacity", 0)
            .attr("data-education", "")
        })


      // tooltip
      d3.select(toolTip.current)
        .style("position", "absolute")
        .style("opacity", 0)
        .style("background", "black")
        .style("color", "white")
        .style("border", "1px solid black")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("pointer-events", "none")

      // legend
      d3.select("#legend").selectAll("*").remove()

      const legend = d3.select("#legend")
        .append("svg")
        .attr("width", 600)
        .attr("height", 50)

      let colors = []

      for (let i = 0; i <= 10; i++) {
        colors.push(d3.interpolateCividis(i / 10))
      }

      colors.forEach((c, i) => {
        legend.append("rect")
          .attr("width", 400 / colors.length)
          .attr("height", 50)
          .attr("x", 100 + i * (400 / colors.length))
          .attr("fill", c)
      })

      legend.append("text")
        .attr("x", 50)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .text("Min Value")

      legend.append("text")
        .attr("x", 550)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .text("Max Value")
    }

  }, [])


  return (<>
    <div id="tooltip" ref={toolTip} hidden></div>
    <div id="title">Choropleth Map by Eward</div>
    <div id="description">States of USA</div>
    <div className="svgContainer"></div>
    <legend id="legend"></legend>
  </>)
}

export default App
