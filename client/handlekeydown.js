function handleKeyDown(event, resultTracker) {

  var keys = {};

  // numbers
  for (var start=48, end=57, i=start, key; i<=end; i++) {
    key = String.fromCharCode(i);
    keys[key] = i;
  }

  // letters
  for (var start=65, end=90, i=start, key; i<=end; i++) {
    key = String.fromCharCode(i);
    keys[key] = i;
    key = String.fromCharCode(i+32);
    keys[key] = i+32;
  }

  switch(event.keyCode) {

    // letter key handling
    case keys.a:
    case keys.A:
      // game.snakes[0].boom();
      break;

    case keys.b:
    case keys.B:
      resultTracker.bomb = true;
      break;

    // arrow key handling
    case 37:
      resultTracker.direction = "left";
      break;
    case 39:
      resultTracker.direction = "right";
      break;
    case 38:
      resultTracker.direction = "up";
      break;
    case 40:
      resultTracker.direction = "down";
      break;

    // the 'enter' key
    case 13:
      chat.enterHit();
      break;

    default:
      resultTracker.direction = false;
      resultTracker.bomb = false;
  }
}