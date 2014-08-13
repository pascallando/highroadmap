/*!
* highroadmap v0.2
*/

/*jslint indent: 4 */
/*global window, $, Highcharts, jQuery */

(function ($) {
    "use strict";

    $.fn.highroadmap = function (options) {
        var defaults = {
                default_colors: null,
                render_to: null,
                callback: null,
                color_grouping: 'status', // status || component,
                show_navigation: true
            },
            settings = $.extend({}, defaults, options);

        /**
         * Uppercases the first letter of a string.
         * @param {string} string The string to convert
         */
        var uc_first = function (string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        };

        /**
         * Checks if Highcharts is loaded
         */
        var check_highcharts = function () {
            if (typeof Highcharts === 'undefined') {
                throw 'Highcharts not loaded';
            }
            Highcharts.setOptions({global: {useUTC: false}}); // Fixe les décalages dus au timezone delay
        };

        /**
         * Checks if a translation dict has been initialized by the user.
         * If not, loads a default values set.
         */
        var check_lang_pack = function () {
            var default_labels = {
                period: "period",
                current_week: "current week",
                next_week: "next week",
                four_weeks: "4 weeks",
                yearly: "yearly",
                formatting: "layout",
                coloring: "colors",
                nothing: "nothing",
                week_short: "w",
                by_status: "by status",
                by_component: "by component",
                filter: "filter"
            };

            if (typeof $.fn.highroadmap.labels !== 'undefined') {
                $.each($.fn.highroadmap.labels, function (index, label) {
                    default_labels[index] = label;
                });
            }
            $.fn.highroadmap.labels = default_labels;
        };

        check_lang_pack();
        check_highcharts();

        /**
         * The Roadmap class
         * @constructor
         * @param {array} items The list of items to process
         * @param {jQuery} where_to_render The graph destination selector
         */
        function Roadmap(items, where_to_render) {
            var ONE_DAY_MS = 1000 * 60 * 60 * 24;

            this.chart = null;
            this.default_colors = ['#428BCA', '#5CB85C', '#F0AD4E', '#D9534F', '#777777', '#5BC0DE', '#42caa8', '#cab542', '#e97fea', '#c4eaa2'];
            this.comps = {};
            this.where_to_render = where_to_render || '#highroadmap_graph';
            this.plot_bands = [];
            this.color_grouping = 'status';
            this.items = items || [];
            this.displayed_items = items || [];

            /**
             * Bilds a dict of all components (item.component)
             * with an associated colors from default_colors list.
             */
            this.build_components_map = function () {
                var self = this,
                    components_length = 0,
                    i,
                    item;

                for (i = self.displayed_items.length - 1; i >= 0; i--) {
                    item = self.displayed_items[i];

                    if (self.comps[item.component] === undefined) {
                        try {
                            self.comps[item.component] = self.default_colors[components_length];
                        } catch (e) {
                            self.comps[item.component] = '#EEEEEE';
                        }
                        components_length++;
                    }
                }
            };

            /**
             * Find the color to apply to an item bar
             * @param {object} item The item to process
             * @return {string} The HEX color code
             */
            this.get_item_color = function (item) {
                var self = this,
                    color = '#C9302C';

                switch (self.color_grouping) {
                case 'status':
                    switch (item.status) {
                    case "Done":
                        color = "#5BB75B";
                        break;
                    case "In progress":
                        color = "#3080ed";
                        break;
                    case "On hold":
                        color = "#ffca59";
                        break;
                    default:
                        color = "#C9302C";
                        break;
                    }
                    break;
                case 'component':
                    color = self.comps[item.component];
                    break;
                }

                return color;
            };

            /**
             * Generate a series object to feed the Highcharts chart
             * @return {array} The series object
             */
            this.calculate_series = function () {
                var self = this,
                    item,
                    color,
                    item_dict,
                    series = [],
                    lines = [],
                    i,
                    j,
                    k,
                    inserted,
                    line,
                    can_insert_on_line,
                    bar;

                for (i = self.displayed_items.length - 1; i >= 0; i--) {
                    item = self.displayed_items[i];
                    color = this.get_item_color(item);
                    inserted = false;
                    item_dict = {
                        low: item.begin_date.getTime(),
                        high: item.end_date.getTime(),
                        url: item.url,
                        task_name: item.name,
                        component_name: item.component,
                        status: item.status,
                        color: color,
                        borderColor: color
                    };

                    for (j = 0; j < lines.length; j++) {
                        line = lines[j];
                        can_insert_on_line = true;

                        for (k = line.length - 1; k >= 0; k--) {
                            bar = line[k];
                            if (item_dict.low < bar.high && item_dict.high > bar.low) {
                                can_insert_on_line = false;
                                break;
                            }
                        }

                        if (can_insert_on_line) {
                            line.push(item_dict);
                            inserted = true;
                            break;
                        }
                    }

                    if (!inserted) {
                        lines.push([item_dict]);
                    }

                }

                // Transform lines to series
                $.each(lines, function (key_line, line) {
                    for (i = line.length - 1; i >= 0; i--) {
                        bar = line[i];
                        bar.x = key_line;
                        series.push(bar);
                    }
                });

                return [{data: series}];
            };


            /**
             * Actually render the graph, invoking Highcharts.Chart
             * @param {function} callback A callback function to fire when
             *                      the graph is rendered.
             */
            this.render = function () {
                var self = this,
                    limits = self.calculate_extremes(),
                    begin_time = limits[0].getTime(),
                    end_time = limits[1].getTime();


                this.build_components_map();

                self.chart = new Highcharts.Chart({
                    title: {text: ''},
                    credits: {enabled: false},
                    legend: false,
                    chart: {
                        renderTo: self.where_to_render,
                        type: 'columnrange',
                        inverted: true,
                        zoomType: 'y'
                    },
                    xAxis: {
                        title: {text: ''},
                        labels: {enabled: false},
                        tickWidth: 0,
                        lineColor: "#FFFFFF",
                    },
                    yAxis: {
                        title: {text: ''},
                        type: 'datetime',
                        min: begin_time,
                        max: end_time,
                        dateTimeLabelFormats: {
                            second: '%H:%M:%S',
                            minute: '%H:%M',
                            hour: '%H:%M',
                            day: '%e %b',
                            week: '%e %b',
                            month: '%b/%y',
                            year: '%Y'
                        },
                        gridLineColor: "#ddd",
                        gridLineDashStyle: 'shortdash',

                        // Draw a vertical line today
                        plotLines: [{
                            color: '#f88',
                            width: 2,
                            value: new Date().getTime(),
                            dashStyle: 'dash'
                        }],
                    },
                    plotOptions: {
                        series: {
                            groupPadding: 0.1,
                            pointPadding: 0.06,
                            shadow: false,
                            animation: false,
                            borderRadius: 3,
                            borderColor: false,
                            events: {
                                click: function (event) {
                                    if (event.point.url) {
                                        window.location.replace(event.point.url);
                                    } else {
                                        return false;
                                    }
                                }
                            }
                        },
                        columnrange: {
                            dataLabels: {
                                enabled: true,
                                inside: true,
                                align: 'center',
                                color: '#444',
                                style: {
                                    fontSize: '9px',
                                },
                                formatter: function () {
                                    // Si le range de dates est trop important (> 8 semaines), on cache les labels
                                    var range = this.point.series.yAxis.getExtremes();
                                    if (range.max - range.min > (15 * 7 * ONE_DAY_MS)) {
                                        return '';
                                    }
                                    return this.point.task_name;
                                }
                            }
                        }
                    },

                    tooltip: {
                        formatter: function () {
                            var content = '<strong>' + this.point.task_name + '</strong>';

                            if (this.point.component_name) {
                                content += '<br/><em>' + this.point.component_name + '</em>';
                            }

                            content += '<br/>' + Highcharts.dateFormat('%e/%b/%Y', this.point.low) + " - " + Highcharts.dateFormat('%e/%b/%Y', this.point.high)

                            if (this.point.status) {
                                content += '<br/>' + this.point.status;
                            }

                            return content;
                        }
                    },

                    series: self.calculate_series()
                });
            };

            /**
             * Calculates the chart extremes depending of all the items
             * @return {array} A tuple representing the min date and max date
             */
            this.calculate_extremes = function () {
                var self = this,
                    min_date = new Date(2100, 1, 1),
                    max_date = new Date(1900, 1, 1),
                    i,
                    item;

                for (i = self.displayed_items.length - 1; i >= 0; i--) {
                    item = self.displayed_items[i];
                    if (item.begin_date < min_date) {
                        min_date = item.begin_date;
                    }
                    if (item.end_date > max_date) {
                        max_date = item.end_date;
                    }
                }
                return [min_date, max_date];
            };

            /**
             * Set chart extremes according to a period shortcut
             * @param {string} period A period shorctut in:
             *                  - current_week
             *                  - four_weeks
             *                  - annual
             *                  - all
             */
            this.set_period = function (period) {
                var self = this,
                    begin_time = null,
                    end_time = null,
                    today = new Date();

                switch (period) {
                case "current_week":
                    begin_time = today.getTime() - (today.getDay() - 1) * ONE_DAY_MS;
                    end_time = today.getTime() + (6 - today.getDay()) * ONE_DAY_MS;
                    break;
                case "four_weeks":
                    var last_monday = today.getTime() - (today.getDay() - 1) * ONE_DAY_MS;
                    var next_sunday = today.getTime() + (6 - today.getDay()) * ONE_DAY_MS;
                    begin_time = last_monday - (ONE_DAY_MS * 7 * 4); // Four weeks earlier
                    end_time = next_sunday + (ONE_DAY_MS * 7 * 4); // Four weeks later
                    break;
                case "annual":
                    begin_time = new Date(today.getFullYear(), 0, 0);
                    end_time = new Date(today.getFullYear(), 11, 30);
                    break;
                case "all":
                    var limits = self.calculate_extremes();
                    begin_time = limits[0];
                    end_time = limits[1];
                    break;
                default:
                    break;
                }

                this.chart.yAxis[0].setExtremes(begin_time, end_time);
            };

            /**
             * Graphically highlights a part of the chart according to
             * a period shortcut
             * @param {string} period A period shorctut in:
             *                  - current_week
             *                  - next_week
             *                  - four_weeks
             */
            this.highlight_period = function (period) {
                var self = this,
                    today = new Date(),
                    i,
                    color,
                    label,
                    begin_time,
                    end_time,
                    next_sprint_begin,
                    next_sprint_end,
                    this_sprint_begin,
                    this_sprint_end;

                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);

                self.remove_highlighting();

                switch (period) {
                case "current_week":
                    this_sprint_begin = today.getTime() - (today.getDay() - 1) * ONE_DAY_MS;
                    this_sprint_end = this_sprint_begin + (ONE_DAY_MS * 7);
                    self.chart.yAxis[0].addPlotBand({
                        id: "plotBand_thisWeek",
                        from: this_sprint_begin,
                        to: this_sprint_end,
                        color: "#F2DEDE",
                        label: {text: uc_first($.fn.highroadmap.labels.current_week)}
                    });
                    self.plot_bands = ['plotBand_thisWeek'];
                    break;
                case "next_week":
                    next_sprint_begin = today.getTime() + (8 - today.getDay()) * ONE_DAY_MS;
                    next_sprint_end = today.getTime() + (15 - today.getDay()) * ONE_DAY_MS;
                    self.chart.yAxis[0].addPlotBand({
                        id: "plotBand_nextWeek",
                        from: next_sprint_begin,
                        to: next_sprint_end,
                        color: "#DFF0D8",
                        label: {text: uc_first($.fn.highroadmap.labels.next_week)}
                    });
                    self.plot_bands = ['plotBand_nextWeek'];
                    break;
                case "four_weeks":
                    var w4p = today.getTime() - (today.getDay() - 1) * ONE_DAY_MS - (ONE_DAY_MS * 7 * 4); // 4 weeks ago, monday
                    self.plot_bands = [];
                    for (i = 0; i <= 8; i++) {
                        begin_time = w4p + i * (ONE_DAY_MS * 7);
                        end_time = begin_time + (ONE_DAY_MS * 7);

                        if (i % 2 === 1) {
                            color = "#dedede";
                        } else {
                            color = "#F5F5F5";
                        }

                        if (i === 4) {
                            label = uc_first($.fn.highroadmap.labels.current_week);
                        } else {
                            label = $.fn.highroadmap.labels.week_short + (i - 4);
                        }

                        self.chart.yAxis[0].addPlotBand({
                            id: 'plotBand_w4_' + i,
                            from: begin_time,
                            to: end_time,
                            color: color,
                            label: {text: label},
                        });
                        self.plot_bands.push('plotBand_w4_' + i);
                    }
                    break;
                }
            };

            /**
             * Remove all graphical highlightings
             */
            this.remove_highlighting = function () {
                var self = this,
                    i;

                for (i = self.plot_bands.length - 1; i >= 0; i--) {
                    self.chart.yAxis[0].removePlotBand(self.plot_bands[i]);
                }
            };

            /**
             * Filters the displayed items list according to a text string
             * @param {string} text A string to filter on
             */
            this.filter_items = function (text) {
                var self = this,
                    i,
                    item;

                text = text.toLowerCase();
                self.displayed_items = [];

                for (i = self.items.length - 1; i >= 0; i--) {
                    item = self.items[i];
                    if (item.name.toLowerCase().indexOf(text) !== -1 || item.component.toLowerCase().indexOf(text) !== -1) {
                        self.displayed_items.push(item);
                    }
                }

                self.render();
            };

        }


        return this.each(function () {
            var $wrapper = $(this).wrap('<div class="highroadmap-wrapper"></div>');
            var $graph = $('<div class="highroadmap-graph"></div>').appendTo($wrapper);
            var roadmap = new Roadmap(settings.items, $graph[0], settings.callback);

            if (settings.default_colors) {
                roadmap.default_colors = settings.default_colors;
            }

            if (settings.color_grouping) {
                roadmap.color_grouping = settings.color_grouping;
            }

            roadmap.render();

            if (settings.callback) {
                settings.callback(roadmap);
            }

            if (settings.show_navigation) {
                var btns = '<div class="btn-group"><div class="btn-group">' +
                    '<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">' + uc_first($.fn.highroadmap.labels.period) + ' <span class="caret"></span></button>' +
                    '<ul class="dropdown-menu" role="menu">' +
                        '<li><a data-action="set-period" data-period="current_week" href="#">' + uc_first($.fn.highroadmap.labels.current_week) + '</a></li>' +
                        '<li><a data-action="set-period" data-period="four_weeks" href="#">' + uc_first($.fn.highroadmap.labels.four_weeks) + '</a></li>' +
                        '<li><a data-action="set-period" data-period="annual" href="#">' + uc_first($.fn.highroadmap.labels.yearly) + '</a></li>' +
                    '</ul>' +
                '</div>' +
                '<div class="btn-group">' +
                    '<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">' + uc_first($.fn.highroadmap.labels.formatting) + ' <span class="caret"></span></button>' +
                    '<ul class="dropdown-menu" role="menu">' +
                        '<li><a data-action="highlight-period" data-period="current_week" href="#">' + uc_first($.fn.highroadmap.labels.current_week) + '</a></li>' +
                        '<li><a data-action="highlight-period" data-period="next_week" href="#">' + uc_first($.fn.highroadmap.labels.next_week) + '</a></li>' +
                        '<li><a data-action="highlight-period" data-period="four_weeks" href="#">' + uc_first($.fn.highroadmap.labels.four_weeks) + '</a></li>' +
                        '<li><a data-action="highlight-period" data-period="none" href="#">' + uc_first($.fn.highroadmap.labels.nothing) + '</a></li>' +
                    '</ul>' +
                '</div>' +
                '<div class="btn-group">' +
                    '<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">' + uc_first($.fn.highroadmap.labels.coloring) + ' <span class="caret"></span></button>' +
                    '<ul class="dropdown-menu" role="menu">' +
                        '<li><a data-action="update-color-grouping" data-type="status" href="#">' + uc_first($.fn.highroadmap.labels.by_status) + '</a></li>' +
                        '<li><a data-action="update-color-grouping" data-type="component" href="#">' + uc_first($.fn.highroadmap.labels.by_component) + '</a></li>' +
                    '</ul>' +
                '</div></div>'+
                '<div class="col-xs-2"><input type="text" class="roadmaper-filter form-control" placeholder="' + uc_first($.fn.highroadmap.labels.filter) + '"></div>';


                $wrapper.prepend('<div class="highroadmap-btns">' + btns + '</div>');

                $wrapper.on('click', 'a[data-action="set-period"]', function () {
                    var period = $(this).data('period');
                    roadmap.set_period(period);
                });

                $wrapper.on('click', 'a[data-action="highlight-period"]', function () {
                    var period = $(this).data('period');
                    roadmap.highlight_period(period);
                });

                $wrapper.on('click', 'a[data-action="update-color-grouping"]', function () {
                    var type = $(this).data('type');
                    roadmap.color_grouping = type;
                    roadmap.render();
                });

                $wrapper.on('keyup', 'input.roadmaper-filter', function () {
                    var text = $(this).val();
                    roadmap.filter_items(text);
                });

            }

        });
    };

}(jQuery));
