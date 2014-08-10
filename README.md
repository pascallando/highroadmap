jquery-pagemap
============

jquery-pagemap is **a simple page map (table of content) maker** based on jQuery.

Why a new TOC creation plugin?
------------------------------
* Pure HTML implementation (`<ul>`), no CSS need.
* Clean slug based anchor links out of the box.
* Plug and play!


Requirements
------------

* [jQuery 1.2.3+](http://jquery.com/)


Installation
------------

1. Download jquery-pagemap and make it accessible in your assets directory.

2. Include jQuery and jquery-pagemap in your page (preferably at the end, just before `</body>`):

	```html
	<script src="jquery.js"></script>
	<script src="jquery-pagemap.js"></script>
	```

4. Make sure you have somewhere to put your table of content. A simple div should be great:

	```html
	<div id="toc"></div>
	```

5. Create your page map:

	```javascript
	$(function () {
		$('#toc').pagemap();
	});
	```

Settings
--------

A couple of optional settings are available.

###Plugin options

Options can be passed to the plugin using a dictionnary:

```javascript
$('#toc').pagemap({
	option_1: 'value',
	option_2: 'other value',
	...
});
```

The available options are listed in the table bellow:

| Option        | Type           | Default value  | Function |
| ------------- |----------------|----------------|----------|
| `toc_container` | string | `'#toc'` | A CSS selector where should be rendered the page map. |
| `start_depth` | number | 2 | The start depth of the table of content. By default, `h1` title will be ignored, starting on `h2`. |
| `end_depth` | number | 5 | The end depth of the table of content. |
| `replace_by_btn` | boolean | `false` | If set to `true`, the table of content will be hidden and a single button will be displayed: user will have to click this button to show the TOC. |
| `btn_classes` | string | `'btn btn-default'` | If `replace_by_btn` is set to `true`, you may want to apply some CSS classes to the button. |
| `btn_classes` | string | `'Show TOC'` | If `replace_by_btn` is set to `true`, you may want to set the button text. |

