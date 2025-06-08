// Layout Element.js
// Version: 1.0.0
// Event: On Awake
// Description: Layout Element custom component

//@input vec2 requestedSize
//@input vec2 minimumSize
//@input vec2 maximumSize
//@input float growWeight
//@input float shrinkWeight

//@input vec4 marginsVec {"label" : "Margins", "hint" : "left, right, bottom, top"}
script.margins = Rect.create(script.marginsVec.x, script.marginsVec.y, script.marginsVec.z, script.marginsVec.w);

var st = script.getSceneObject().getComponent("Component.ScreenTransform");
if(isNull(st)) {
    st = script.getSceneObject().createComponent("Component.ScreenTransform");
    print("Warning, Screen Transform component not found on " + script.getSceneObject().name);
}

var dirty = true;

function getRequestedSize () {
    return script.requestedSize;
}

function getMinimumSize (){
    return script.minimumSize;
}

function getMaximumSize () {
    return script.maximumSize;
}

function getGrowWeight () {
    return script.growWeight;
}

function getShrinkWeight () {
    return script.shrinkWeight;
}

function getMargins (){
    return script.margins;
}

function markDirty () {
    dirty = true;
}

function isDirty (){
    return dirty;
}

function markClean(){
    dirty = false;
}

//public api 

script.markClean = markClean;
script.isDirty = isDirty
script.markDirty = markDirty;
script.getRequestedSize = getRequestedSize;
script.getMinimumSize = getMinimumSize;
script.getMaximumSize = getMaximumSize;
script.getGrowWeight = getGrowWeight;
script.getShrinkWeight = getShrinkWeight;
script.getMargins = getMargins;


script._isOfType = function(name) {
    return name == "LayoutElement"         
        || script.isOfType(name);
}