# datetime-selector
A lightweight, useful date&time selector

## Usage

#### html

`<input type="text" data-id="datetime-selector">`

#### js

`var dts = new dateTimeSelector();`

## Configuration

- **el**: the element of DOM node to initialize the plugin
- **type**: type of plugin, it can be set as `t-basic`, `t-simple`, `t-range`, `t-combined` and `null` so far.
- **time**: customize time for initialization
- **maxData**: limit the number of selected item, `-1` is default and means no limitation.
- **onScroll**: callback function for scrolling.
- **onChange**: callback function for selecting time.
- **onCancel**: callback function for close selector

## Useful Methods
```
	var dts = new dateTimeSelector();
	ds.getTime();

    More methods will be added later.
```

## Changelog

### v1.0.0
- Support 4 type of selector.
- Support basic functions of a time selector
