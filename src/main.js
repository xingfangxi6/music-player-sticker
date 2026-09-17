import {mountEditor} from './editor/editor.js';
import {installCompatibility} from './editor/platform.js';
import background from './assets/default-background.jpg';
import cover from './assets/default-cover.jpg';
installCompatibility();
mountEditor(document.querySelector('#editor'),{background,cover});
