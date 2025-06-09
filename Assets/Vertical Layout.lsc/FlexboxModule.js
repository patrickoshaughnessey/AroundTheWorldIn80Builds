/**
 * @module FlexboxModule
 * Module providing helper classes for making layouts of screen transforms
 * @author Snap Inc.
 * @version 1.0.0
 * 
 * ====  Example ====
 * @example
 * 
 * // Import module
 * var flexbox = require("./FlexboxModule");
 */


/**
 * Enum for direction
 * @readonly
 * @enum {number}
 */
var Direction = {
    Default: 0,
    Reverse: 1
}

/**
 * Enum for axis
 * @readonly
 * @enum {number}
 */
var Axis = {
    Horizontal: 0,
    Vertical: 1
}

/**
 * Enum for stretch mode
 * @readonly
 * @enum {number}
 */
var FlexFactor = {
    Grow: 0,
    Shrink: 1
};
function OverrideSetting() {
    this.overrideRequestedSize = false;
    this.requestedSize = 0;
    this.overrideMinimumSize = false;
    this.minimumSize = 0;
    this.overrideMaximumSize = false;
    this.maximumSize = 0;
    this.overrideGrowWight = false;
    this.growWeight = 0;
    this.overrideShrinkWeight = false;
    this.shrinkWeight = 0;
}
/**
 * @class
 */
function Container() {
    this.direction = Direction.Default;
    this.axis = Axis.Horizontal;
    this.children = [];
    this.size = new vec2(1, 1);
    this.padding = { left: 0, right: 0, top: 0, bottom: 0 };
    this.horizAlignment = HorizontalAlignment.Center;
    this.vertAlignment = HorizontalAlignment.Center;

    //override object
    this.overrideSetting = new OverrideSetting();
}
/**
 * 
 * @param {vec2} vec 
 * @param {Axis} axis 
 * @returns 
 */
function accessSize(vec, axis) {
    if (axis == Axis.Horizontal) {
        return vec.x;
    }
    return vec.y;
}

/**
 * 
 * @param {Rect} margins 
 * @param {Axis} axis 
 * @returns 
 */
function accessMarginTotal(margins, axis) {
    if (axis == Axis.Horizontal) {
        return margins.left + margins.right;
    }
    return margins.top + margins.bottom;
}

/**
 * 
 * @param {*} widget 
 * @param {FlexFactor} factor 
 * @param {OverrideSettings} overrideSettings
 * @returns 
 */
function accessWeight(widget, factor, overrideSettings) {
    if (factor == FlexFactor.Grow) {
        return overrideSettings.overrideGrowWight ? overrideSettings.growWeight : widget.getGrowWeight();
    }
    return overrideSettings.overrideShrinkWeight ? overrideSettings.shrinkWeight : widget.getShrinkWeight();
}

//An implementation of the flexbox algorithm, with only the context specific to our use case 
//https://www.w3.org/TR/css-flexbox-1/#resolve-flexible-lengths
/**
 * 
 */
Container.prototype.runLayout = function () {
    var layout = [];
    var used = 0;
    var overrideSetting = this.overrideSetting;
    this.children.forEach(function (widget) {
        var requestedSize = overrideSetting.overrideRequestedSize ? overrideSetting.requestedSize : widget.getRequestedSize();
        var size = accessSize(requestedSize, this.axis);
        used += size;
        var marginTotal = accessMarginTotal(widget.getMargins(), this.axis);
        used += marginTotal;
        layout.push({ flexBasis: size, frozen: false, mainSize: size });
    });

    var realSize = new vec2(0, 0);
    realSize.x = this.size.x - (this.padding.left + this.padding.right);
    realSize.y = this.size.y - (this.padding.top + this.padding.bottom);

    var flex = FlexFactor.Grow;
    var initialFreeSpace = accessSize(realSize, this.axis);
    if (used > initialFreeSpace) {
        flex = FlexFactor.Shrink;
    }
    var resolved = false;
    var frozenCount = 0;
    var unfrozenWeight = 0;
    var unfrozenScaledShrinkFactor = 0;
    for (var i = 0; i < this.children.length; i++) {
        var weight = accessWeight(this.children[i], flex, overrideSetting);
        if (weight == 0) {
            layout[i].frozen = true;
            frozenCount++;
            continue;
        }
        unfrozenWeight += weight;
        unfrozenScaledShrinkFactor += layout[i].flexBasis * weight;
    }
    var newUnfrozenWeight = unfrozenWeight;
    var newUnfrozenScaledShrinkFactor = unfrozenScaledShrinkFactor;
    while (!resolved && frozenCount < this.children.length) {
        //"initial free space" after setup or previous iteration
        var remainingFreeSpace = accessSize(realSize, this.axis) - used;
        //clear loop tracking	
        unfrozenWeight = newUnfrozenWeight;
        newUnfrozenWeight = 0;
        unfrozenScaledShrinkFactor = newUnfrozenScaledShrinkFactor;
        newUnfrozenScaledShrinkFactor = 0;
        resolved = true;
        used = 0;
        frozenCount = 0;

        //Step 4b
        if (unfrozenWeight < 1 && unfrozenWeight * initialFreeSpace < remainingFreeSpace) {
            remainingFreeSpace = unfrozenWeight * initialFreeSpace;
        }

        for (var i = 0; i < this.children.length; i++) {

            var maximumSize = overrideSetting.overrideMaximumSize ? overrideSetting.maximumSize : this.children[i].getMaximumSize();
            var minimumSize = overrideSetting.overrideMinimumSize ? overrideSetting.minimumSize : this.children[i].getMinimumSize();

            if (layout[i].frozen) {
                used += layout[i].mainSize;
                used += accessMarginTotal(this.children[i].getMargins(), this.axis);
                frozenCount++;
                continue;
            }
            var childWeight = accessWeight(this.children[i], flex, overrideSetting);
            if (flex == FlexFactor.Grow) {
                var growValue = (childWeight / unfrozenWeight) * remainingFreeSpace;
                var maxDim = accessSize(maximumSize, this.axis);
                if (maxDim > 0 && (layout[i].flexBasis + growValue > maxDim)) {
                    resolved = false;
                    frozenCount++;
                    layout[i].frozen = true;
                    layout[i].mainSize = maxDim;
                }
                else {
                    layout[i].mainSize = layout[i].flexBasis + growValue;
                    newUnfrozenWeight += childWeight;
                }
            } else {
                var scaledShrinkFactor = layout[i].flexBasis * childWeight;
                var shrinkValue = (scaledShrinkFactor / unfrozenScaledShrinkFactor) * remainingFreeSpace;
                var minDim = accessSize(minimumSize, this.axis);
                if (layout[i].flexBasis + shrinkValue < minDim) {
                    resolved = false;
                    frozenCount++;
                    layout[i].frozen = true;
                    layout[i].mainSize = minDim;
                }
                else {
                    layout[i].mainSize = layout[i].flexBasis + shrinkValue;
                    newUnfrozenWeight += childWeight;
                    newUnfrozenScaledShrinkFactor += scaledShrinkFactor;
                }
            }
            if (layout[i].frozen) {
                used += layout[i].mainSize;
            } else {
                used += layout[i].flexBasis;
            }
            used += accessMarginTotal(this.children[i].getMargins(), this.axis);
        }
    }
    if (this.axis == Axis.Vertical) {
        if (this.direction == Direction.Default) {
            used = this.padding.top;
        } else {
            used = this.padding.bottom;
        }
    }
    if (this.axis == Axis.Horizontal) {
        if (this.direction == Direction.Default) {
            used = this.padding.left;
        } else {
            used = this.padding.right;
        }
    }
    for (var i = 0; i < this.children.length; i++) {

        var requestedSize = overrideSetting.overrideRequestedSize ? overrideSetting.requestedSize : this.children[i].getRequestedSize();

        var st = this.children[i].getSceneObject().getComponent("Component.ScreenTransform");
        st.offsets = Rect.create(0, 0, 0, 0);
        st.anchors = Rect.create(0, 0, 0, 0);
        if (this.axis == Axis.Vertical) {
            if (this.direction == Direction.Default) {
                used += this.children[i].getMargins().top;
                st.anchors.top = (1 - (used / this.size.y)) * 2 - 1;
                used += layout[i].mainSize;
                st.anchors.bottom = (1 - (used / this.size.y)) * 2 - 1;
                used += this.children[i].getMargins().bottom;
            } else {
                used += this.children[i].getMargins().bottom;
                st.anchors.bottom = -((1 - (used / this.size.y)) * 2 - 1);
                used += layout[i].mainSize;
                st.anchors.top = -((1 - (used / this.size.y)) * 2 - 1);
                used += this.children[i].getMargins().top;
            }
            if (this.horizAlignment == HorizontalAlignment.Left) {
                st.anchors.left = -1;
                st.anchors.right = -1;
                st.offsets.left = this.children[i].getMargins().left + this.padding.left;
                st.offsets.right = this.children[i].getMargins().left + this.padding.left + requestedSize.x;
            }
            if (this.horizAlignment == HorizontalAlignment.Right) {
                st.anchors.left = 1;
                st.anchors.right = 1;
                st.offsets.left = -this.children[i].getMargins().right - this.padding.right - requestedSize.x;
                st.offsets.right = -this.children[i].getMargins().right - this.padding.right;
            }
            if (this.horizAlignment == HorizontalAlignment.Center) {
                st.offsets.left = -requestedSize.x / 2.0;
                st.offsets.right = requestedSize.x / 2.0;
            }
        } else {
            if (this.direction == Direction.Default) {
                used += this.children[i].getMargins().left;
                st.anchors.left = -((1 - (used / this.size.x)) * 2 - 1);
                used += layout[i].mainSize;
                st.anchors.right = -((1 - (used / this.size.x)) * 2 - 1);
                used += this.children[i].getMargins().right;
            } else {
                used += this.children[i].getMargins().right;
                st.anchors.right = (1 - (used / this.size.x)) * 2 - 1;
                used += layout[i].mainSize;
                st.anchors.left = (1 - (used / this.size.x)) * 2 - 1;
                used += this.children[i].getMargins().left;
            }
            if (this.vertAlignment == VerticalAlignment.Bottom) {
                st.anchors.top = -1;
                st.anchors.bottom = -1;
                st.offsets.top = this.children[i].getMargins().bottom + this.padding.bottom + requestedSize.y;
                st.offsets.bottom = this.children[i].getMargins().bottom + this.padding.bottom;
            }
            if (this.vertAlignment == VerticalAlignment.Top) {
                st.anchors.top = 1;
                st.anchors.bottom = 1;
                st.offsets.top = -this.children[i].getMargins().top - this.padding.top;
                st.offsets.bottom = -this.children[i].getMargins().top - this.padding.top - requestedSize.y;
            }
            if (this.vertAlignment == VerticalAlignment.Center) {
                st.offsets.top = requestedSize.y / 2.0;
                st.offsets.bottom = -requestedSize.y / 2.0;
            }
        }
    }

}
Container.prototype.updateOverrideSetting = function (
    overrideRequestedSize,
    requestedSize,
    overrideMaximumSize,
    maximumSize,
    overrideMinimumSize,
    minimumSize,
    overrideGrowWeight,
    growWeight,
    overrideShrinkWeight,
    shrinkWeight) {
    this.overrideSetting.overrideRequestedSize = overrideRequestedSize;
    this.overrideSetting.requestedSize = requestedSize;
    this.overrideSetting.overrideMinimumSize = overrideMinimumSize;
    this.overrideSetting.minimumSize = minimumSize;
    this.overrideSetting.overrideMaximumSize = overrideMaximumSize;
    this.overrideSetting.maximumSize = maximumSize;
    this.overrideSetting.overrideGrowWight = overrideGrowWeight;
    this.overrideSetting.growWeight = growWeight;
    this.overrideSetting.overrideShrinkWeight = overrideShrinkWeight;
    this.overrideSetting.shrinkWeight = shrinkWeight;
}
module.exports = {
    Direction: Direction,
    Axis: Axis,
    Container: Container
}
