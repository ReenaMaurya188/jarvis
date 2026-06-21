// Constants
const PINCH_ENTER_THRESHOLD = 0.04;
const PINCH_EXIT_THRESHOLD = 0.06;
const DOUBLE_TAP_TIMEOUT = 400; // ms
const SWIPE_THRESHOLD = 0.2; // Normalized X distance
const SWIPE_TIMEOUT = 500; // ms

export class GestureMath {
  constructor() {
    this.isPinchingLeft = false;
    this.isPinchingRight = false;
    
    // Double Tap State
    this.lastPinchTimeLeft = 0;
    this.lastPinchTimeRight = 0;
    this.doubleTapEventLeft = false;
    this.doubleTapEventRight = false;

    // Swipe State
    this.lastWristX = null;
    this.lastWristTime = 0;
    this.swipeEvent = null; // 'left' or 'right'
  }

  static distance(p1, p2) {
    return Math.sqrt(
      Math.pow(p1.x - p2.x, 2) + 
      Math.pow(p1.y - p2.y, 2) + 
      Math.pow(p1.z - p2.z, 2)
    );
  }

  update(handLandmarks, isLeftHand, timestamp) {
    if (!handLandmarks) return { pinch: false, doubleTap: false, openPalm: false, thumbsUp: false, swipe: null };

    // 1. Pinch Detection
    const thumbTip = handLandmarks[4];
    const indexTip = handLandmarks[8];
    const dist = GestureMath.distance(thumbTip, indexTip);
    
    let isPinching = isLeftHand ? this.isPinchingLeft : this.isPinchingRight;
    let justPinched = false;

    if (isPinching) {
      if (dist > PINCH_EXIT_THRESHOLD) isPinching = false;
    } else {
      if (dist < PINCH_ENTER_THRESHOLD) {
        isPinching = true;
        justPinched = true;
      }
    }

    if (isLeftHand) this.isPinchingLeft = isPinching;
    else this.isPinchingRight = isPinching;

    // 2. Double Tap Detection
    let doubleTap = false;
    if (justPinched) {
      const lastPinchTime = isLeftHand ? this.lastPinchTimeLeft : this.lastPinchTimeRight;
      if (timestamp - lastPinchTime < DOUBLE_TAP_TIMEOUT) {
        doubleTap = true;
      }
      if (isLeftHand) this.lastPinchTimeLeft = timestamp;
      else this.lastPinchTimeRight = timestamp;
    }

    // 3. Open Palm Detection
    // All fingertips (8,12,16,20) are far from wrist (0)
    const wrist = handLandmarks[0];
    const fingersExtended = [8, 12, 16, 20].every(idx => GestureMath.distance(handLandmarks[idx], wrist) > 0.4);
    // Thumb is also extended
    const thumbExtended = GestureMath.distance(handLandmarks[4], handLandmarks[17]) > 0.3;
    const openPalm = fingersExtended && thumbExtended;

    // 4. Thumbs Up Detection
    // Thumb tip is "up" (lower y value), other fingers are curled (close to palm/wrist)
    const fingersCurled = [8, 12, 16, 20].every(idx => GestureMath.distance(handLandmarks[idx], wrist) < 0.25);
    const thumbUp = handLandmarks[4].y < handLandmarks[3].y && handLandmarks[4].y < handLandmarks[5].y;
    const thumbsUp = fingersCurled && thumbUp;

    // 5. Swipe Detection
    let swipe = null;
    if (this.lastWristX !== null && timestamp - this.lastWristTime < SWIPE_TIMEOUT) {
      const dx = wrist.x - this.lastWristX;
      if (dx > SWIPE_THRESHOLD) {
        swipe = 'right';
        this.lastWristX = null; // Reset
      } else if (dx < -SWIPE_THRESHOLD) {
        swipe = 'left';
        this.lastWristX = null; // Reset
      }
    }
    
    if (timestamp - this.lastWristTime >= SWIPE_TIMEOUT) {
      this.lastWristX = wrist.x;
      this.lastWristTime = timestamp;
    }

    return {
      pinch: isPinching,
      doubleTap,
      openPalm,
      thumbsUp,
      swipe,
      wrist
    };
  }

  static calculateTwoHandDistance(hand1, hand2) {
    if (!hand1 || !hand2) return null;
    return GestureMath.distance(hand1[9], hand2[9]);
  }

  static calculateTwoHandAngle(leftHand, rightHand) {
    if (!leftHand || !rightHand) return null;
    const dx = rightHand[9].x - leftHand[9].x;
    const dy = rightHand[9].y - leftHand[9].y;
    return Math.atan2(dy, dx);
  }

  static getPinchMidpoint(hand) {
    if (!hand) return null;
    const thumb = hand[4];
    const index = hand[8];
    return {
      x: (thumb.x + index.x) / 2,
      y: (thumb.y + index.y) / 2,
      z: (thumb.z + index.z) / 2
    };
  }
}
