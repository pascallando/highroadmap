var today = new Date();
var items = [
    {
        name: "One",
        due_date: new Date(),
        estimate: 7,
        component: 'Comp_1',
        status: 'Done'
    },
    {
        name: "Two",
        due_date: new Date(today.getFullYear(), today.getMonth()+1, today.getDate()),
        estimate: 10,
        component: 'Comp_2',
        status: 'Done',
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
        // default_colors: ['#000'],
        callback: function (event) {
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
