// Vertical Layout.js
// Version: 1.0.0
// Event: On Awake
// Description: Vertical Layout Custom Component,  Requires Layout Element Custom Component to be added to children

//@input int alignment {"widget":"combobox", "values":[{"label":"Left", "value":0}, {"label":"Center", "value":1}, {"label":"Right", "value":2}]}
//@input int direction {"widget":"combobox", "values":[{"label":"TopDown", "value":0}, {"label":"BottomUp", "value":1}]}
//@input float growWeight
//@input float shrinkWeight
//@input vec4 paddingsVec {"label" : "Paddings", "hint" : "left, right, bottom, top"}
//@input vec4 marginsVec {"label" : "Margins", "hint" : "left, right, bottom, top"}

//@ui {"widget":"group_start","label":"Override Settings", "hint" : "Override settings of child layout elements"}
//@input bool overrideRequestedSize {"label" : "Requested Size"}
//@input vec2 requestedSize {"showIf" : "overrideRequestedSize", "label" : "Value"}
//@input bool overrideMinimumSize {"label" : "Minimum Size"}
//@input vec2 minimumSize {"showIf" : "overrideMinimumSize", "label" : "Value"}
//@input bool overrideMaximumSize {"label" : "Maximum Size"}
//@input vec2 maximumSize {"showIf" : "overrideMaximumSize", "label" : "Value"}
//@input bool overrideGrowWeight {"label" : "Grow Weight"}
//@input float growWeightOverride {"showIf" : "overrideGrowWeight", "label" : "Value"}
//@input bool overrideShrinkWeight {"label" : "Shrink Weight"}
//@input float shrinkWeightOverride {"showIf" : "overrideShrinkWeight", "label" : "Value"}
//@ui {"widget":"group_end"}

const epsilon = 0.00005;
var Flexbox = require("FlexboxModule");

script.padding = Rect.create(script.paddingsVec.x,
    script.paddingsVec.y,
    script.paddingsVec.z,
    script.paddingsVec.w);

script.margins = Rect.create(script.marginsVec.x,
    script.marginsVec.y,
    script.marginsVec.z,
    script.marginsVec.w)

var layout = new Flexbox.Container();
layout.direction = script.direction;
layout.axis = Flexbox.Axis.Vertical;
layout.horizAlignment = script.alignment;

var sceneObject = script.getSceneObject();

var st = sceneObject.getComponent("Component.ScreenTransform");
if (isNull(st)) {
    st = sceneObject.createComponent("Component.ScreenTransform");
    print("Warning, Screen Transform component not found on " + sceneObject.name);
}

var dirty = false;
var lastWidgets = [];
var lastSize = new vec2(0, 0);
var lastPadding = {};

script.createEvent("LateUpdateEvent").bind(runLayout);

function markDirty() {
    dirty = true;
}
function isDirty() {
    return dirty;
}

function markClean() {
    //no-op marks self clean after layout
}

function rectCompare(left, right) {
    if (Math.abs(left.left - right.left) > epsilon) {
        return false;
    }
    if (Math.abs(left.right - right.right) > epsilon) {
        return false;
    }
    if (Math.abs(left.top - right.top) > epsilon) {
        return false;
    }
    if (Math.abs(left.bottom - right.bottom) > epsilon) {
        return false;
    }
    return true;
}


function updateWidgets() {
    var widgets = [];
    var count = sceneObject.getChildrenCount();
    layout.updateOverrideSetting(
        script.overrideRequestedSize,
        script.requestedSize,
        script.overrideMaximumSize,
        script.maximumSize,
        script.overrideMinimumSize,
        script.minimumSize,
        script.overrideGrowWeight,
        script.growWeight,
        script.overrideShrinkWeight,
        script.shrinkWeight
    );
    for (var i = 0; i < count; i++) {
        var components = sceneObject.getChild(i).getComponents("Component.ScriptComponent");
        for (var j = 0; j < components.length; j++) {
            if (components[j]._isOfType != undefined && components[j]._isOfType("LayoutElement")) {
                widgets.push(components[j]);
                dirty |= i >= lastWidgets.length || lastWidgets[i] != components[j];
                dirty |= components[j].isDirty();
                components[j].markClean();
                break;
            }
        }
    }
    if (lastWidgets.length > widgets.length) {
        dirty = true;
    }
    lastWidgets = widgets;
    layout.children = widgets;
}

function runLayout() {
    if (sceneObject.getParent() == null) {
        return;
    }
    var components = sceneObject.getParent().getComponents("Component.ScriptComponent");
    for (var j = 0; j < components.length; j++) {
        if (components[j]._isOfType != undefined && components[j]._isOfType("Container")) {
            components[j].runLayout();
            break;
        }
    }
    updateWidgets();
    var tl = st.localPointToWorldPoint(new vec2(-1, -1));
    var br = st.localPointToWorldPoint(new vec2(1, 1));
    layout.size = new vec2(br.x - tl.x, br.y - tl.y);
    layout.padding = script.padding;
    dirty |= !layout.size.equal(lastSize);
    dirty |= !rectCompare(layout.padding, lastPadding);
    lastSize = layout.size;
    lastPadding = layout.padding;
    if (dirty) {
        layout.runLayout();
        dirty = false;
    }
}

function getRequestedSize() {
    updateWidgets();
    var result = new vec2(0.0, 0.0);
    layout.children.forEach(function (widget) {
        var widgetSize = widget.getRequestedSize();
        result.y += widgetSize.y;
        result.x = Math.max(result.x, widgetSize.x);
    });
    return result;
}

function getMinimumSize() {
    updateWidgets();
    var result = new vec2(0.0, 0.0);
    layout.children.forEach(function (widget) {
        var widgetSize = widget.getMinimumSize();
        result.y += widgetSize.y;
        result.x = Math.max(result.x, widgetSize.x);
    });
    return result;
}

function getMaximumSize() {
    updateWidgets();
    var result = new vec2(Number.MAX_SAFE_INTEGER, 0.0);
    layout.children.forEach(function (widget) {
        var widgetSize = widget.getMaximumSize();
        result.y += widgetSize.y;
        result.x = Math.min(result.x, widgetSize.x);
    });
    return result;
}

function getGrowWeight() {
    return script.growWeight;
}

function getShrinkWeight() {
    return script.shrinkWeight;
}

function getMargins() {
    return script.margins;
}

script.markClean = markClean;
script.isDirty = isDirty
script.markDirty = markDirty;
script.getRequestedSize = getRequestedSize;
script.getMinimumSize = getMinimumSize;
script.getMaximumSize = getMaximumSize;
script.runLayout = runLayout;
script.getGrowWeight = getGrowWeight;
script.getShrinkWeight = getShrinkWeight;
script.getMargins = getMargins;


Object.defineProperty(script, 'alignment', {
    get: function () { return layout.horizAlignment; },
    set: function (alignment) { layout.horizAlignment = alignment; }
});

Object.defineProperty(script, 'direction', {
    get: function () { return layout.direction; },
    set: function (direction) { layout.direction = direction; }
});

script._isOfType = function (name) {
    return name == "LayoutElement"
        || name == "Container"
        || name == "VerticalLayout"
        || script.isOfType(name);
}