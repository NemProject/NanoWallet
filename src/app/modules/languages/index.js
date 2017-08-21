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

import SpanishProvider from './cn';
app.config(SpanishProvider);

import PolishProvider from './pl';
app.config(PolishProvider);

import GermanProvider from './de';
app.config(GermanProvider);

import JapaneseProvider from './jp';
app.config(JapaneseProvider);

import RussianProvider from './ru';
app.config(RussianProvider);

export default app;
