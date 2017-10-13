import React, { Component } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  PanResponder,
} from 'react-native';
import PropTypes from 'prop-types';
import { StatusBarDefaultBarStyle, StatusBarDefaultBackgroundColor, DEFAULT_IMAGE_DIMENSIONS, WINDOW, IS_IOS, IS_ANDROID } from './constants';
import { validateType } from './functions';
import Label from './label';
import ImageView from './imageview';

export default class DropdownAlert extends Component {
  static propTypes = {
    closeInterval: PropTypes.number,
    startDelta: PropTypes.number,
    endDelta: PropTypes.number,
    onClose: PropTypes.func,
    onCancel: PropTypes.func,
    showCancel: PropTypes.bool,
    tapToCloseEnabled: PropTypes.bool,
    panResponderEnabled: PropTypes.bool,
    replaceEnabled: PropTypes.bool,
    sensitivity: PropTypes.number,
  };
  static defaultProps = {
    onClose: null,
    onCancel: null,
    closeInterval: 4000,
    startDelta: -100,
    endDelta: 0,
    showCancel: false,
    tapToCloseEnabled: true,
    panResponderEnabled: true,
    replaceEnabled: true,
    sensitivity: 20,
  };
  constructor(props) {
    super(props);
    this.state = {
      animationValue: new Animated.Value(0),
      fadeAnim: new Animated.Value(0),
      duration: 450,
      isOpen: false,
      startDelta: props.startDelta,
      endDelta: props.endDelta,
      topValue: 0,
    };
  }
  componentWillMount() {
    this.createPanResponder();
  }
  componentWillUnmount() {
    if (this.closeTimeoutId != null) {
      clearTimeout(this.closeTimeoutId);
    }
  }

  render() {
    const {isOpen} = this.state;
    const {children} = this.props

    if (isOpen) {
      return (
        <Animated.View
          ref={ref => this.mainView = ref}
          {...this._panResponder.panHandlers}
          style={{
            transform: [{
              translateY: this.state.animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [this.state.startDelta, this.state.endDelta]
              })
            }],
            position: 'absolute',
            top: this.state.topValue,
            left: 0,
            right: 0,
            elevation: this.props.elevation,
            opacity: this.state.fadeAnim
          }}>
          <TouchableOpacity
            onPress={() => this.close('tap')}
            onLayout={event => this.onLayoutEvent(event)}>

            {children}

          </TouchableOpacity>
        </Animated.View>
      );
    }
    return null;
  }

  createPanResponder = () => {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        return this.props.panResponderEnabled;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) < this.props.sensitivity && Math.abs(gestureState.dy) >= this.props.sensitivity && this.props.panResponderEnabled;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy < 0) {
          this.setState({
            topValue: gestureState.dy,
          });
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const delta = this.state.startDelta / 5;
        if (gestureState.dy < delta) {
          this.close('pan');
        }
      },
      onPanResponderTerminate: (evt, gestureState) => {
        const delta = this.state.startDelta / 5;
        if (gestureState.dy < delta) {
          this.close('pan');
        }
      },
    });
  };
  alert = () => {
    if (this.props.replaceEnabled == false) {
      this.setState({
        isOpen: true,
        topValue: 0,
      });
      if (this.state.isOpen == false) {
        this.animate(1);
        this.fadeIn()
      }
      if (this.props.closeInterval > 1) {
        if (this.closeTimeoutId != null) {
          clearTimeout(this.closeTimeoutId);
        }
        this.closeTimeoutId = setTimeout(
          function() {
            this.close('automatic');
          }.bind(this),
          this.props.closeInterval
        );
      }
    } else {
      var delayInMilliSeconds = 0;
      if (this.state.isOpen == true) {
        delayInMilliSeconds = 475;
        this.close();
      }
      var self = this;
      setTimeout(
        function() {
          if (self.state.isOpen == false) {
            self.setState({
              isOpen: true,
              topValue: 0,
            });
          }
          self.animate(1);
          self.fadeIn()
          if (self.props.closeInterval > 1) {
            this.closeTimeoutId = setTimeout(
              function() {
                self.close('automatic');
              }.bind(self),
              self.props.closeInterval
            );
          }
        }.bind(this),
        delayInMilliSeconds
      );
    }
  };
  close = action => {
    if (action == undefined) {
      action = 'programmatic';
    }
    var onClose = this.props.onClose;
    if (action == 'cancel') {
      onClose = this.props.onCancel;
    }
    if (this.state.isOpen) {
      if (this.closeTimeoutId != null) {
        clearTimeout(this.closeTimeoutId);
      }
      this.animate(0);
      this.fadeOut();
      setTimeout(
        function() {
          if (this.state.isOpen) {
            this.setState({
              isOpen: false,
            });
            if (onClose) {
              var data = {
                action: action, // !!! How the alert was closed: automatic, programmatic, tap, pan or cancel
              };
              onClose(data);
            }
          }
        }.bind(this),
        this.state.duration
      );
    }
  };
  closeDirectly() {
    if (this.state.isOpen) {
      if (this.closeTimeoutId != null) {
        clearTimeout(this.closeTimeoutId);
      }
      this.setState({
        isOpen: false,
      });
    }
  }
  animate = toValue => {
    Animated.spring(this.state.animationValue, {
      toValue: toValue,
      duration: this.state.duration,
      friction: 9,
      useNativeDriver: IS_IOS,
    }).start();
  }

  fadeIn = () => {
    Animated.timing(this.state.fadeAnim, {
      toValue: 1,
      duration: this.state.duration,
      easing: Easing.quad,
      useNativeDriver: IS_IOS,
    }).start()
  }

  fadeOut = () => {
    Animated.timing(this.state.fadeAnim, {
      toValue: 0,
      duration: this.state.duration / 4,
      easing: Easing.ease,
      useNativeDriver: IS_IOS,
    }).start()
  }

  onLayoutEvent(event) {
    const { x, y, width, height } = event.nativeEvent.layout;
    var actualStartDelta = this.state.startDelta;
    var actualEndDelta = this.state.endDelta;
    const { startDelta, endDelta } = this.props;
    if (startDelta < 0) {
      const delta = 0 - height;
      if (delta != startDelta) {
        actualStartDelta = delta;
      }
    } else if (startDelta > WINDOW.height) {
      actualStartDelta = WINDOW.height + height;
    }
    if (endDelta < 0) {
      actualEndDelta = 0;
    } else if (endDelta > WINDOW.height) {
      actualEndDelta = WINDOW.height - height;
    }
    const heightDelta = WINDOW.height - endDelta - height;
    if (heightDelta < 0) {
      actualEndDelta = endDelta + heightDelta;
    }
    if (actualStartDelta != this.state.startDelta || actualEndDelta != this.state.endDelta) {
      this.setState({
        startDelta: actualStartDelta,
        endDelta: actualEndDelta,
      });
    }
  }
}
