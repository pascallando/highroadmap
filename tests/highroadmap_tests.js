var items = [
    {
        name: "One",
        begin_date: new Date(2014, 0, 1),
        end_date: new Date(2014, 0, 31),
        component: 'Comp_1',
        status: 'Done'
    },
    {
        name: "Two",
        begin_date: new Date(2014, 1, 5),
        end_date: new Date(2014, 2, 12),
        component: 'Comp_2',
        status: 'On hold',
        url: "http://github.com"
    },
    {
        name: "Three",
        begin_date: new Date(2014, 0, 22),
        end_date: new Date(2014, 2, 2),
        component: 'Comp_2',
        status: 'In progress',
        url: "http://github.com"
    },
    {
        name: "Four",
        begin_date: new Date(2014, 1, 26),
        end_date: new Date(2014, 4, 2),
        component: 'Comp_3',
        status: 'Todo',
        url: "http://github.com"
    },
    {
        name: "Five",
        begin_date: new Date(2014, 4, 2),
        end_date: new Date(2014, 4, 4),
        component: 'Comp_3',
        status: 'Todo',
        url: "http://github.com"
    }
];


asyncTest("Basic initialization", function(assert) {
    expect(1);
    $('body').append($('<div id="my_roadmap">'));
    $('#my_roadmap').highroadmap({
        items: [items[0]],
        default_colors: ['#000'],
        color_grouping: 'status',
        callback: function (roadmap, event) {
            roadmap.chart.setTitle({text: 'The chart title!'});
            ok(true, "Roadmap rendered !");
            start();
        }
    });
});


asyncTest("Initialization with no items", function(assert) {
    expect(1);
    $('body').append($('<div id="my_roadmap">'));
    $('#my_roadmap').highroadmap({
        callback: function (event) {
            ok(true, "Nothing done, callback called.");
            start();
        }
    });
});


asyncTest("Initialization with multiple items", function(assert) {
    expect(1);
    $('body').append($('<div id="my_roadmap">'));
    $('#my_roadmap').highroadmap({
        items: items,
        show_navigation: false,
        color_grouping: 'status',

        // default_colors: ['#000'],
        callback: function (roadmap, event) {
            console.log(roadmap.calculate_series());
            ok(true, "Roadmap rendered !");
            start();
        }
    });
});


QUnit.module("Multiple initializations on same page");

QUnit.asyncTest("Basic initialization 1", function(assert) {
    expect(1);
    $('body').append($('<div id="my_roadmap_1">'));
    $('#my_roadmap_1').highroadmap({
        items: [items[0]],
        callback: function (event) {
            ok(true, "Roadmap rendered !");
            start();
        }
    });
});


QUnit.asyncTest("Basic initialization 2", function(assert) {
    expect(1);
    $('body').append($('<div id="my_roadmap_2">'));
    $('#my_roadmap_2').highroadmap({
        items: [items[0]],
        callback: function (event) {
            ok(true, "Roadmap rendered !");
            start();
        }
    });
});
