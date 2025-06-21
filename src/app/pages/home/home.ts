import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  /*
## Animation Details:

1. **Floating Elements**: Animated icons that gently float up and down in the hero section
2. **Fade-in Animation**: Content elements that gracefully fade into view
3. **Slide-in Animation**: Resume preview that slides in from the right
4. **Fade-in-up Animation**: Feature cards that appear while moving upward
5. **Fade-in-left Animation**: Step cards that appear while moving from left
6. **Flow Animation**: Animated connectors between steps with a flowing light effect
7. **Pulse Animation**: Subtle pulsing effect for the call-to-action section
8. **Hover Animations**: Interactive elements like buttons and cards respond to hover

This design combines simplicity with engaging animations that enhance the user experience without overwhelming visitors. The animations are triggered as elements enter the viewport, creating a delightful scrolling experience.
*/
}
