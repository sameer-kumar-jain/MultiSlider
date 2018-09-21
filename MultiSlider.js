'use strict';

import React, {
  PureComponent,
} from "react";

import {
  Text,
  Button,
  Animated,
  Image,
  StyleSheet,
  PanResponder,
  View,
  Easing,
  ViewPropTypes
} from "react-native";

function Rect(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
}
Rect.prototype.containsPoint = function(x, y) {
  return (x >= this.x
          && y >= this.y
          && x <= this.x + this.width
          && y <= this.y + this.height);
};

var THUMB_SIZE = 20;
let currentX = 0, lastX=0, thumbIndex=-1, minimum=0, maximum=0;
export default class MultiSlider extends PureComponent {
  constructor(props){
    super(props);
    this.state={
      thumbArray:props.values.map((value)=>({value:value,translateX:0}))
    }
  }
  componentWillMount() {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this._handleStartShouldSetPanResponder,
      onMoveShouldSetPanResponder: this._handleMoveShouldSetPanResponder,
      onPanResponderGrant: this._handlePanResponderGrant,
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderRelease: this._handlePanResponderEnd,
      onPanResponderTerminationRequest: this._handlePanResponderRequestEnd,
      onPanResponderTerminate: this._handlePanResponderEnd,
    });
  };
  _handlePanResponderGrant = (e: Object/*, gestureState: Object*/) => {
    const{thumbArray} = this.state;
    lastX = thumbArray[thumbIndex].translateX;
    minimum = thumbIndex===0?thumbArray[thumbIndex].min:thumbArray[0].translateX+this.state.thumbSize.width;
    maximum = thumbIndex===0?thumbArray[1].translateX:thumbArray[1].max;
    currentX = e.nativeEvent.locationX;
  };
  _handleStartShouldSetPanResponder = (e: Object, /*gestureState: Object*/): boolean => {
    var nativeEvent = e.nativeEvent;
    thumbIndex = this.state.thumbArray.findIndex(thumb=>new Rect(thumb.translateX,0,61,61).containsPoint(nativeEvent.locationX, nativeEvent.locationY))
    return thumbIndex>=0;
  };
  _handleMoveShouldSetPanResponder(/*e: Object, gestureState: Object*/): boolean {
    // Should we become active when the user moves a touch over the thumb?
    return false;
  };
  _handlePanResponderMove = (e: Object, /*gestureState: Object*/): boolean => {
   // console.log(lastX, currentX, e.nativeEvent.locationX)
    this.onThumbMove((e.nativeEvent.locationX- currentX)+lastX);
  };
  _handlePanResponderRequestEnd(e: Object, gestureState: Object) {
    // Should we allow another component to take over this pan?
    return false;
  };

  _measureContainer = (x: Object) => {
    this._handleMeasure('containerSize', x);
  };
  _measureTrack = (x: Object) => {
    this._handleMeasure('trackSize', x);
  };
  _measureThumb = (x: Object) => {
    this._handleMeasure('thumbSize', x);
  };
  _handleMeasure = (name: string, x: Object) => {
    var {width, height} = x.nativeEvent.layout;
    var size = {width: width, height: height};

    var storeName = `_${name}`;
    var currentSize = this[storeName];
    if (currentSize && width === currentSize.width && height === currentSize.height || this.state.allMeasured) {
      return;
    }
    this[storeName] = size;

    if (this._containerSize && this._trackSize && this._thumbSize) {
      const{thumbArray} = this.state;
      this.setState({
        containerSize: this._containerSize,
        trackSize: this._trackSize,
        thumbSize: this._thumbSize,
        allMeasured: true,
        thumbArray: thumbArray.map(thumb=>Object.assign(thumb,{
          translateX: thumb.value*((this._containerSize.width-this._thumbSize.width)/this.props.maximum),
          min:0, max:this._containerSize.width-this._thumbSize.width}))
      },()=>console.log(this.state))
    }
  };
  onThumbMove = ( value)=>{
    let {thumbArray} = this.state;
    value = Math.min(Math.max(value,minimum), maximum)
    thumbArray[thumbIndex].translateX = value;
    var length = this.state.containerSize.width - this.state.thumbSize.width;
    var thumbLeft = thumbArray[thumbIndex].translateX;
    var ratio = thumbLeft / length;
    thumbArray[thumbIndex].value = parseInt((Math.max(this.props.minimum,
      Math.min(this.props.maximum,
        this.props.minimum + Math.round(ratio * (this.props.maximum - this.props.minimum) / this.props.step) * this.props.step
      )
    ))*10)/10;
    this.setState({thumbArray: thumbArray, value},()=>{
      this.props.onValuesChange(thumbArray[0].value,thumbArray[1].value)
    })
  }
  render(){
    const {touchOverflowStyle} = this.props;
    const{thumbArray} = this.state;
    return(
    <View style={{justifyContent:'center', position:'relative', width:'100%', height:60}} onLayout={this._measureContainer}>
      <View
        style={[{backgroundColor: '#000000', height: 2}]}
        renderToHardwareTextureAndroid={true}
        onLayout={this._measureTrack} 
      >
      <View
        style={[{backgroundColor: '#0A2DFC', height: 2,marginLeft:thumbArray[0].translateX, width:thumbArray[1].translateX-thumbArray[0].translateX }]}
        renderToHardwareTextureAndroid={true}
      />
      </View>
      {thumbArray.map((thumb, index)=>
      <Animated.View key={index} onLayout={this._measureThumb}
        renderToHardwareTextureAndroid={true}
        style={{backgroundColor: '#0A2DFC', position:'absolute', height:60, width:60, borderRadius:30, left:thumb.translateX}}
      >
      <Text style={{width:'100%', height:'100%', textAlign:'center', color:'#FFFFFF', 
    textAlignVertical:'center',}}>{thumb.value}</Text>
      </Animated.View>
      )}
      <View
        renderToHardwareTextureAndroid={true}
        style={[defaultStyles.touchArea, touchOverflowStyle]}
        {...this._panResponder.panHandlers}>
      </View>
    </View>
    )
  }

}

var defaultStyles = StyleSheet.create({
thumb: {
  position: 'absolute',
  width: THUMB_SIZE,
  height: THUMB_SIZE,
  borderRadius: THUMB_SIZE / 2,
},
touchArea: {
  position: 'absolute',
  backgroundColor: 'transparent',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
},
})