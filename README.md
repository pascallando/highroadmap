Highroadmap
===========

Highroadmap is **a simple roadmap graphs generator** based on Highcharts library.

Requirements
------------

* [jQuery](http://jquery.com/)
* [Highcharts](http://www.highcharts.com/)
* [Highcharts more](http://code.highcharts.com/)

Example
-------
![Highroadmap example](http://img15.hostingpics.net/pics/974375highmaps.png "Highroadmap")

Installation
------------

1. Download Highroadmap and make it accessible in your assets directory.

2. Include jQuery, Highcharts, Highcharts more and Highroadmap in your page:

	```html
	<script src="jquery.js"></script>
	<script src="highcharts.js"></script>
	<script src="highcharts-more.js"></script>	
	<script src="highroadmap.js"></script>
	```

3. Highroadmap default language is **English**. If needed, you can also include a language pack in order to get your content translated:

	```html
	<script src="highroadmap/lang/fr.js"></script>
	```

4. Declare your roadmap items:

	```javascript
	var items_list = [
	    {
	        name: "Find a guitar",
	        begin_date: new Date(2014, 0, 10),
	        end_date: new Date(2014, 0, 20)
	    },
	    {
	        name: "Learn chords",
	        begin_date: new Date(2014, 0, 20),
	        end_date: new Date(2014, 5, 30)
	    },
	    {
	        name: "Learn scales",
	        begin_date: new Date(2014, 3, 1),
	        end_date: new Date(2014, 6, 30)
	    },
	    {
	        name: "Plan a gig",
	        begin_date: new Date(2014, 6, 1),
	        end_date: new Date(2014, 6, 15)
	    }
	];
	```

5. Generate your roadmap (see it live on [JSFiddle](http://jsfiddle.net/8htku3d4/)):

	```javascript
	$(function () {
	    $('#my-roadmap').highroadmap({
	        items: items_list
	    });	
	});
	```

Settings
--------

A couple of optional settings are available.

###Roadmap items customization

####Component name

The item component name is a string. If provided, the component's name is displayed in item tooltip.

```javascript
{
    name: "Learn chords",
    begin_date: new Date(2014, 0, 20),
    end_date: new Date(2014, 5, 30),
    component: "Apprenticeship"
}
```
####Status

The item status is a string. If provided, the item status is displayed in item tooltip, and may be used to filter the displayed item.

Possible values: `"To do"`, `"In progress"`, `"On hold"`, `"Done"`

```javascript
{
    name: "Learn chords",
    begin_date: new Date(2014, 0, 20),
    end_date: new Date(2014, 5, 30),
    status: "Done"
}
```
####URL

A destination URL where the user should be redirected when clicking on an item bar in the roadmap.

```javascript
{
    name: "Learn chords",
    begin_date: new Date(2014, 0, 20),
    end_date: new Date(2014, 5, 30),
    url: "http://www.apprendre-guitare.e-musicien.fr/apprendre-accords.html"
}
```

###Plugin options

Options can be passed to the plugin using a dictionnary:

```javascript
$('#my_roadmap').highroadmap({
	option_1: 'value',
	option_2: 'other value',
	...
});
```

The available options are listed in the table bellow:

| Option        | Type           | Default value  | Function |
| ------------- |----------------|----------------|----------|
| `items` | array |  | A list of Javascript objects containing items informations. |
| `show_navigation` | boolean | false | When set to `true`, Highroadmap will add a couple of navigation and filtering tool above the roadmap. |
| `color_grouping` | string | "status" | Allows to define how the items will be colored on the roadmap. `"status"` mode will colorize all items with same status with a common color. `"component"` will colorize all items with same component with a common color. |
| `default_colors` | array | ['#428BCA', '#5CB85C', '#F0AD4E', '#D9534F', '#777777', '#5BC0DE', '#42caa8', '#cab542', '#e97fea', '#c4eaa2'] | A list of strings representing HEX colors which are used if `color_grouping` is set to `"component"`. |
| `callback(roadmap)` | function |  | A function to be fired when the roadmap has been rendered. The `roadmap` object is passed to the function. Highcharts chart object is accessible as a `chart` property of this object (`roadmap.chart`). |




Miscellaneous
-------------

### Bootstrap integration

Even if [Bootstrap](http://getbootstrap.com/) front-end framework is not required to run Highroadmap, it integrates well with it. If you use Bootstrap on your pages, your roadmaps should look quite sweet without writing extra CSS.
