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

2. Include jQuery and Highroadmap in your page:

	```html
	<script src="jquery.js"></script>
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
	        end_date: new Date(2014, 0, 20),
	    },
	    {
	        name: "Learn chords",
	        begin_date: new Date(2014, 0, 20),
	        end_date: new Date(2014, 5, 30),
	    },
	    {
	        name: "Learn scales",
	        begin_date: new Date(2014, 3, 1),
	        end_date: new Date(2014, 6, 30),
	    },
	    {
	        name: "Plan a gig",
	        begin_date: new Date(2014, 6, 1),
	        end_date: new Date(2014, 6, 15),
	    }
	];
	```

5. Generate your roadmap (see it live on JSFiddle):

	```javascript
	$(function () {
	    $('#my-roadmap').highroadmap({
	        items: items_list
	    });	
	});
	```









Miscellaneous
-------------

### Bootstrap integration

Even if [Bootstrap](http://getbootstrap.com/) front-end framework is not required to run Highroadmap, it integrates well with it. If you use Bootstrap on your pages, your roadmaps should look quite sweet without writing extra CSS.
