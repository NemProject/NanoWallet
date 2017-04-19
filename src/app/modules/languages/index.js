import angular from 'angular';

// Create the module where our functionality can attach to
let app = angular.module('app.lang', ['pascalprecht.translate']);

// Include languages
import EnglishProvider from './en';
app.config(EnglishProvider);

/*import FrenchProvider from './fr';
app.config(FrenchProvider);*/

import ChineseProvider from './cn';
app.config(ChineseProvider);

import PolishProvider from './pl';
app.config(PolishProvider);

import JapaneseProvider from './jp';
app.config(JapaneseProvider);


import SpanishProvider from './es';
app.config(SpanishProvider);

export default app;