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

import PortugueseBRProvider from './ptbr';
app.config(PortugueseBRProvider);

import GermanProvider from './de';
app.config(GermanProvider);

import JapaneseProvider from './jp';
app.config(JapaneseProvider);

import RussianProvider from './ru';
app.config(RussianProvider);

import DutchProvider from './nl';
app.config(DutchProvider);

import CroatianProvider from './hr';
app.config(CroatianProvider);

import SpanishProvider from './es';
app.config(SpanishProvider);

// Comment this while developing to see untranslated strings
app.config(['$translateProvider', function($translateProvider) {
    $translateProvider.fallbackLanguage('en');
}]);

export default app;