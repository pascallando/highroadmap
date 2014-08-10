/*!
* highroadmap v0.1
*/

/*jslint indent: 4 */
/*global window, $, Highcharts */

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
        }

        /**
         * Checks if Highcharts is loaded
         */
        var check_highcharts = function () {
            if (typeof Highcharts === 'undefined') {
                throw 'Highcharts not loaded';
            }
            Highcharts.setOptions({global: {useUTC: false}}); // Fixe les décalages dus au timezone delay
        }

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
                nothing: "nothing",
                week_short: "w"
            }

            if (typeof $.fn.highroadmap.labels != 'undefined') {
                $.each($.fn.highroadmap.labels, function(index, label) {
                    default_labels[index] = label;
                });
            }
            $.fn.highroadmap.labels = default_labels;
        }

        check_lang_pack();
        check_highcharts();


        /**
         * The Roadmap class
         */
        function Roadmap(items, where_to_render) {
            var ONE_DAY_MS = 1000 * 60 * 60 * 24;

            this.chart = null;
            this.items = items || [];
            this.default_colors = ['#428BCA', '#5CB85C', '#F0AD4E', '#D9534F', '#777777', '#5BC0DE', '#42caa8', '#cab542', '#e97fea', '#c4eaa2'];
            this.comps = {};
            this.where_to_render = where_to_render || '#highroadmap_graph';
            this.plot_bands = [];
            this.color_grouping = 'status';

            /**
             * Bilds a dict of all components (item.component)
             * with an associated colors from default_colors list.
             */
            this.build_components_map = function () {
                var self = this,
                    components_length = 0,
                    i;

                for (i = self.items.length - 1; i >= 0; i--) {
                    if (self.comps[self.items[i].component] === undefined) {
                        try {
                            self.comps[self.items[i].component] = self.default_colors[components_length];
                        } catch (e) {
                            self.comps[self.items[i].component] = '#EEEEEE';
                        }
                        components_length++;
                    }
                }
            };

            this.calculate_lines = function () {
                var lines = [];

                $.each(this.items, function (id, item) {
                    var item_begin_time = item.due_date.getTime() - item.estimate * (ONE_DAY_MS);
                    var item_end_time = item.due_date.getTime();
                    var item_length = item_end_time - item_begin_time;

                    var item_dict = {id: item.id, name: item.name, url: item.url, component: item.component, status: item.status, item_length: item_length, begin_time: item_begin_time, end_time: item_end_time, natural_begin_time: new Date(item_begin_time), natural_end_time: new Date(item_end_time)};

                    if (lines.length === 0) {
                        lines.push([item_dict]);
                    } else {
                        var item_inserted = false;
                        $.each(lines, function (id_line, line) { // On parcourt les lignes existantes pour trouver une place à notre item...
                            $.each(line, function (id_block, block) { // Sur chaque ligne, on parcourt les blocks...
                                if (item_inserted === false) {
                                    if (id_block === 0 && item_end_time <= block.begin_time) { // On est sur le premier item de la ligne et l'item à insérer est avant lui
                                        line.unshift(item_dict);
                                        item_inserted = true;
                                    } else {
                                        if (id_block === line.length - 1 && item_begin_time >= block.end_time) { // On est sur le dernier item de la ligne et l'item à insérer est après lui
                                            line.push(item_dict);
                                            item_inserted = true;
                                        } else {
                                            if (line[id_block - 1] !== undefined && item_begin_time >= line[id_block - 1].end_time && item_end_time <= block.begin_time) { // On est sur un block et l'item peut se caser entre le block précédent et celui-ci
                                                line.splice(id_block, 0, item_dict);
                                                item_inserted = true;
                                            }
                                        }
                                    }
                                }
                            });
                        });
                        if (item_inserted === false) { // On n'a pas réussi à le casser dans un espace vide, on crée une ligne
                            lines.push([item_dict]);
                        }
                    }
                });
                return lines;
            };

            this.insert_blanks_in_lines = function (lines) {
                var lines_with_blanks = [],
                    blank_dict,
                    i;

                $.each(lines, function (id, line) { // Pour chaque ligne...
                    lines_with_blanks.push([]);
                    $.each(line, function (id_block, block) { // Pour chaque block...
                        if (id_block === 0) { // C'est le premier, on ajoute un block vide au début de la nouvelle ligne...
                            blank_dict = {id: null, name: "BLANK", component: "", item_length: block.begin_time, begin_time: 0, end_time: block.begin_time, natural_begin_time: new Date(0), natural_end_time: new Date(block.begin_time)};
                            lines_with_blanks[id].push(blank_dict);
                        } else {
                            if (line[id_block - 1].id !== null) { // Si le block précédent n'est pas déjà un blanc, on ajoute un blanc avant le block en cours
                                blank_dict = {id: null, name: 'BLANK', component: '', begin_time: line[id_block - 1].end_time, end_time: block.begin_time};
                                blank_dict.item_length = blank_dict.end_time - blank_dict.begin_time;
                                blank_dict.natural_begin_time = new Date(blank_dict.begin_time);
                                blank_dict.natural_end_time = new Date(blank_dict.end_time);
                                lines_with_blanks[id].push(blank_dict);
                            }
                        }
                        // On insère le block à la fin de la nouvelle ligne
                        lines_with_blanks[id].push({id: block.id, url: block.url, name: block.name, component: block.component, status: block.status, begin_time: block.begin_time, end_time: block.end_time, item_length: block.item_length, natural_begin_time: block.natural_begin_time, natural_end_time: block.natural_end_time});
                    });
                });

                var max_length = 0;
                for (i = 0; i < lines_with_blanks.length; i++) {
                    if (lines_with_blanks[i].length > max_length) {
                        max_length = lines_with_blanks[i].length;
                    }
                }

                $.each(lines_with_blanks, function (id, line) {
                    var missing_lines = max_length - line.length;
                    if (missing_lines > 0) {
                        for (i = 0; i < missing_lines; i++) {
                            line.push({id: null, name: "BLANK", item_length: 0});
                        }
                    }
                });
                return lines_with_blanks;
            };

            this.calculate_series = function () {
                var self = this,
                    lines = this.insert_blanks_in_lines(this.calculate_lines()),
                    series = [],
                    block_id = 0,
                    remaining_items,
                    serie;

                do {
                    remaining_items = false;
                    serie = {data: [], name: []};

                    $.each(lines, function (id, line) {
                        if (line[block_id] !== undefined) {
                            serie.data.push({y: line[block_id].item_length});
                            serie.name.push({id: line[block_id].id, url: line[block_id].url, task_name: line[block_id].name, component_name: line[block_id].component, begin_date: line[block_id].begin_time, end_date: line[block_id].end_time, status: line[block_id].status });

                            switch (self.color_grouping) {
                            case 'status':
                                switch(line[block_id].status) {
                                    case "Done":
                                        serie.data[serie.data.length - 1].color = "#3080ed";
                                        break;
                                    case "In progress":
                                        serie.data[serie.data.length - 1].color = "#ffca59";
                                        break;
                                    case "On hold":
                                        serie.data[serie.data.length - 1].color = "#987aed";
                                        break;
                                    case "To do":
                                        serie.data[serie.data.length - 1].color = "#d95668";
                                        break;
                                    default:
                                        serie.data[serie.data.length - 1].color = "transparent";
                                        serie.data[serie.data.length - 1].borderColor = "transparent";
                                        break;
                                }
                                break;
                            case 'component':
                                if (line[block_id].component === undefined || line[block_id].component === '') {
                                    serie.data[serie.data.length - 1].color = 'transparent';
                                    serie.data[serie.data.length - 1].borderColor = 'transparent';
                                } else {
                                    serie.data[serie.data.length - 1].color = self.comps[line[block_id].component];
                                }
                                break;
                            }

                            serie.borderColor = "transparent";
                            serie.borderWidth = 0;
                            serie.dataLabels = {
                                enabled: true,
                                color: '#333',
                                align: 'center',
                                style: {
                                    //fontWeight:'bold',
                                    fontSize: "9px",
                                    //letterSpacing: "-1px"
                                },

                                formatter: function() {
                                    // Si le range de dates est trop important (> 8 semaines), on cache les labels
                                    var range = this.series.yAxis.getExtremes();
                                    if (range.max - range.min > (15 * 7 * ONE_DAY_MS) || this.series.name[this.x].task_name === "BLANK") {
                                        return '';
                                    }
                                    return this.series.name[this.x].task_name;
                                }
                            };

                            remaining_items = true;
                        }
                    });

                    if (serie.data.length > 0) {
                        series.unshift(serie);
                    }
                    block_id++;
                } while (remaining_items);

                return series;
            };

            /**
             * Actually render the graph, invoking Highcharts.Chart
             * @param {function} callback A callback function to fire when
             *                      the graph is rendered.
             */
            this.render = function (callback) {
                var self = this,
                    now = new Date(),
                    last_monday = now.getTime() - (now.getDay() - 1) * ONE_DAY_MS,
                    next_sunday = now.getTime() + (6 - now.getDay()) * ONE_DAY_MS,
                    begin_time = last_monday - (ONE_DAY_MS * 7 * 4), // Quatre semaines plus tôt
                    end_time = next_sunday + (ONE_DAY_MS * 7 * 4); // Quatre semaines plus tard

                this.build_components_map();

                self.chart = new Highcharts.Chart({
                    title: {text: ''},
                    credits: {enabled: false},
                    legend: false,
                    chart: {
                        renderTo: self.where_to_render,
                        zoomType: 'y',
                        type: 'bar',
                        events: {
                            load: function (event) {
                                if (callback) {
                                    callback(event);
                                }
                            }
                        }
                    },
                    xAxis: {
                        title: {text: ''},
                        labels: {enabled: false},
                        tickWidth: 0,
                        lineColor: "transparent",
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
                        gridLineColor: "#dedede",
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
                            stacking: 'normal',
                            shadow: false,
                            animation: false,
                            borderRadius: 5,
                            events: {
                                click: function (event) {
                                    if (event.point.series.name[event.point.x].url) {
                                        window.location.replace(event.point.series.name[event.point.x].url);
                                    } else {
                                        return false;
                                    }
                                }
                            }
                        },
                    },
                    tooltip: {
                        formatter: function () {
                            if (this.series.name[this.x] === undefined  || this.series.name[this.x].task_name === "BLANK") {
                                return false;
                            }
                            return '<b>' + this.series.name[this.x].component_name + "</b><br/>" + this.series.name[this.x].task_name + "<br/>" + Highcharts.dateFormat('%e/%b/%Y', this.series.name[this.x].begin_date) + " - " + Highcharts.dateFormat('%e/%b/%Y', this.series.name[this.x].end_date) + "<br/>" + this.series.name[this.x].status;
                        }
                    },

                    series: self.calculate_series()
                });
            };

            this.set_period = function (period) {
                var begin_time = null,
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
                    begin_time = last_monday - (ONE_DAY_MS * 7 * 4); // Quatre semaines plus tôt
                    end_time = next_sunday + (ONE_DAY_MS * 7 * 4); // Quatre semaines plus tôt
                    break;
                case "annual":
                    begin_time = Date.UTC(today.getFullYear(), 0, 0);
                    end_time = Date.UTC(today.getFullYear(), 11, 30);
                    break;
                default:
                    break;
                }

                this.chart.yAxis[0].setExtremes(begin_time, end_time);
            };

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
                        color: "#fee",
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
                        color: "#dfffdf",
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
                            color = "#efefef";
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

            this.remove_highlighting = function () {
                var self = this,
                    i;

                for (i = self.plot_bands.length - 1; i >= 0; i--) {
                    self.chart.yAxis[0].removePlotBand(self.plot_bands[i]);
                }
            };

        }


        return this.each(function () {
            var $wrapper = $(this).wrap('<div class="roadmap-wrapper"></div>');
            var roadmap = new Roadmap(settings.items, $wrapper[0], settings.callback);

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
                '</div></div>';

                $wrapper.prepend('<div class="highroadmap-btns">' + btns + '</div>');

                $wrapper.on('click', 'a[data-action="set-period"]', function () {
                    var period = $(this).data('period');
                    roadmap.set_period(period);
                });

                $wrapper.on('click', 'a[data-action="highlight-period"]', function () {
                    var period = $(this).data('period');
                    roadmap.highlight_period(period);
                });
            }

        });
    };

}(jQuery));
