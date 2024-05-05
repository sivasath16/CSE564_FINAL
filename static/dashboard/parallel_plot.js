const columnTypes = {
    'Entity': 'categorical',
    'Code': 'categorical',
    'Year': 'categorical',
    'Neoplasm rate': 'numerical',
    'Age: 15-49 years': 'numerical',
    'Age: 5-14 years': 'numerical',
    'Age: 50-69 years': 'numerical',
    'Age: 70+ years': 'numerical',
    'Age: Under 5': 'numerical',
    'DALYs cancer Std Rate': 'numerical',
    'types of cancer': 'categorical',
    'number of ppl with cancer': 'numerical',
    'death rates': 'numerical'
};

function isCategorical(columnName) {
    return columnTypes[columnName] === 'categorical';
}



document.addEventListener('DOMContentLoaded', function () {
    fetch('/pcp')
        .then(response => response.json())
        .then(data => {
            var columns = data.columns;
            var cluster_labels = data.cluster_labels
            var col_names = data.col_names
            drawPcp(columns, cluster_labels, col_names);
        })
        .catch(error => console.error('Error fetching data:', error));

    function drawPcp(data, cluster_labels, col_names) {
        d3.select('#pcp').selectAll('*').remove();
    
        const colorScale = d3.schemeCategory10;
        const myScheme = [];
    
        var margin = { top: 40, right: 2, bottom: 10, left: 5 },
            width = 1100 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;
        
        var dimensions = col_names
    
        var y = {};
        for (var i in dimensions) {
            var name = dimensions[i];
            if (isCategorical(name)) {
                var uniqueValues = Array.from(new Set(data.map(function (d) {
                    return d[name];
                }))).sort(d3.ascending);
    
                y[name] = d3.scaleBand()
                    .domain(uniqueValues)
                    .range([height, 0])
                    .padding(0.1);
            } else {
                y[name] = d3.scaleLinear()
                    .domain(d3.extent(data, function (d) {
                        return +d[name];
                    }))
                    .range([height, 0]).nice();
            }
        }
    
        var x = d3.scalePoint()
            .range([0, width])
            .padding(1)
            .domain(dimensions);
    
        var line = d3.line()
            .x(function (d) { return x(d[0]); })
            .y(function (d) {
                var val = d[1];
                var scale = y[d[0]];
                if (scale.bandwidth) {
                    return scale(val) + scale.bandwidth() / 2; 
                } else {
                    return scale(val);
                }
            });
    
        var dragging = {};
    
        var svg = d3.select("#pcp").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        svg.selectAll("myPath")
        .data(data)
            .enter().append("path")
            .attr("class", "data-line")
            .attr("d", function (d) {
                return line(dimensions.map(function (p) {
                    return [p, d[p]];
                }));
            })
            .style("fill", "none")
            .attr("stroke", (d, i) => colorScale[(cluster_labels[i])])
            .style("opacity", 0.5);
            
            var g = svg.selectAll(".dimension")
            .data(dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function (d) {
                return "translate(" + x(d) + ")";   
            });
    
            const axes = svg
            .append("g")
            .selectAll("g")
            .data(dimensions)
            .join("g")
            .attr("transform", d => `translate(${x(d)},0)`)
            .each(function(d) {
                d3.select(this).call(d3.axisRight(y[d]));
            })
            .call(g => g.append("text")
            .attr("class", "axis-text") 
            .attr("x", -20)
            .attr("y", -25)
            .attr("text-anchor", "start")
            .attr("fill", "black")
            .text(d => d))
            .style("font-size", "8px")
            
        function brush(event) {
            var actives = [];
            svg.selectAll(".brush")
                .filter(function(d) {
                    return d3.brushSelection(this);
                })
                .each(function(d) {
                    actives.push({
                        dimension: d,
                        extent: d3.brushSelection(this)
                    });
                });
    
            if (actives.length === 0) {
                svg.selectAll(".data-line")
                    .style("stroke", (d, i) => colorScale[cluster_labels[i]])
                    .style("opacity", 0.9); 
            } else {
                svg.selectAll(".data-line")
                    .style("stroke", "#ccc")
                    .style("opacity", 0.1);
                svg.selectAll(".data-line")
                .filter(function(d) {
                    return actives.every(function(active) {
                        var dim = active.dimension;
                        var extent = active.extent;
                        var scale = y[dim];
                        var value = d[dim];
                        if (isCategorical(dim)) {
                            var bandPosition = scale(value) + scale.bandwidth() / 2;
                            return extent[0] <= bandPosition && bandPosition <= extent[1];
                        } else {

                            return extent[0] <= scale(value) && scale(value) <= extent[1];
                        }
                    });
                })
                .style("stroke", (d, i) => colorScale[cluster_labels[i]])
                .style("opacity", 0.9);
            }
        }
    
        g.append("g")
            .attr("class", "brush")
            .each(function(d) {
                d3.select(this).call(y[d].brush = d3.brushY()
                    .extent([[-10, 0], [10, height]])
                    .on("start", brush)   
                    .on("brush", brush)
                    .on("end", brush)); 
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);
    
    
            
        
        function transition(g) {
            return g.transition().duration(100);
        }
    
        function position(d) {
            var v = dragging[d];
            return v == null ? x(d) : v;
        }
    
        axes.selectAll("text.axis-text")
        .call(d3.drag()
            .subject(function(event, d) { return { x: x(d) }; })
            .on("start", function(event, d) {
                dragging[d] = x(d);
        })
        .on("drag", function(event, d) {
            dragging[d] = Math.min(width - margin.right - margin.left, Math.max(0, event.x));
            dimensions.sort(function(a, b) { return position(a) - position(b); });
            x.domain(dimensions);
            axes.attr("transform", function(d) { return "translate(" + position(d) + ")"; });
            svg.selectAll(".data-line")
                .attr("d", d => d3.line()
                    .defined(([, value]) => value != null)  
                    .x(([key]) => x(key))
                    .y(([key, value]) => isCategorical(key) ? y[key](value) + y[key].bandwidth() / 2 : y[key](value))
                    (d3.cross(dimensions, [d], (key, d) => [key, d[key]])));
        })
        .on("end", function(event, d) {
            delete dragging[d];
            transition(d3.select(this.parentNode)).attr("transform", "translate(" + x(d) + ")");
            svg.selectAll(".data-line")
                .attr("d", d => d3.line()
                    .defined(([, value]) => value != null)  
                    .x(([key]) => x(key))
                    .y(([key, value]) => isCategorical(key) ? y[key](value) + y[key].bandwidth() / 2 : y[key](value))
                    (d3.cross(dimensions, [d], (key, d) => [key, d[key]])));
        }));
    
    }
});