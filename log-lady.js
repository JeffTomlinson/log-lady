'use strict';

exports.handler = (event, context) => {
  const alexa = Alexa.handler(event, context);
  alexa.resources = languageStrings;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

const Alexa = require('alexa-sdk');
const _ = require('lodash');
const characters = require('./characters');

// Translatable strings.
const languageStrings = {
  'en-US': {
    translation: {
      CHARACTERS: characters.EN_US,
      SKILL_NAME: 'The Log Lady',
      WELCOME_MESSAGE: "I am known as the Log Lady. My log hears things I cannot hear. You can ask my log things like: Who is Laura Palmer? Or, who played Agent Dale Cooper? Ask it.",
      WELCOME_REPROMPT: 'For instructions on what you can ask my log, please say help me.',
      INFO_CARD_TITLE: '%s  - About %s.',
      ACTORS_CARD_TITLE: '%s  - Who played %s.',
      HELP_MESSAGE: "You can ask my log things like, who is Laura Palmer, or, you can say exit...Ask it.",
      HELP_REPROMPT: "You can ask my log things like, who played Special Agent Dale Cooper, or, you can say exit...Ask it.",
      NOT_FOUND_MESSAGE: "I do not know, but one day my log will have something to say about this.",
      GENERIC_REPROMPT: "What else would you ask of my log?",
      ACTORS_RESPONSE: '%s was played by %s.',
      CONCAT_AND: 'and',
      STOP_MESSAGE: 'It has been a pleasure speaking to you.'
    }
  }
};

// Skill handlers.
const handlers = {
  // New session handler.
  'NewSession': function () {
    this.attributes.speechOutput = this.t('WELCOME_MESSAGE', this.t('SKILL_NAME'));
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    this.attributes.speechReprompt = this.t('WELCOME_REPROMPT');
    this.emit(':ask', this.attributes.speechOutput, this.attributes.speechReprompt);
  },
  // Intent handler for GetCharacterInfo.
  'GetCharacterInfo': function () {
    // Get intent value.
    const character = this.event.request.intent.slots.CharacterInfo.value;
    let speechReprompt = this.t('GENERIC_REPROMPT');
    let speechOutput = this.t('NOT_FOUND_MESSAGE') + ' ' +  speechReprompt;

    if (character && character.length) {
      // Get characters data.
      let options = this.t('CHARACTERS');
      // Get best match for the input value.
      let characterData = getDataBestMatch(character, options);

      if (characterData) {
        speechOutput = characterData.summary + ' ' +  speechReprompt;
        let cardTitle = this.t('INFO_CARD_TITLE', this.t('SKILL_NAME'), characterData.name);
        this.attributes.speechOutput = speechOutput;
        this.attributes.speechReprompt = speechReprompt;
        this.emit(':askWithCard', speechOutput, speechReprompt, cardTitle, speechOutput);
      }
    }

    this.attributes.speechOutput = speechOutput;
    this.attributes.speechReprompt = speechReprompt;
    this.emit(':ask', speechOutput, speechReprompt);
  },
  // Intent handler for GetCharacterActors.
  'GetCharacterActors': function () {
    // Get intent value.
    const character = this.event.request.intent.slots.CharacterActors.value;
    let speechReprompt = this.t('GENERIC_REPROMPT');
    let speechOutput = this.t('NOT_FOUND_MESSAGE') + ' ' +  speechReprompt;

    if (character && character.length) {
      // Get characters data.
      let options = this.t('CHARACTERS');
      // Get best match for the input value.
      let characterData = getDataBestMatch(character, options);

      if (characterData) {
        speechOutput = this.t('ACTORS_RESPONSE', characterData.name, arrayConcat(characterData.actors, ', ', ', ' + this.t('CONCAT_AND') + ' '));
        let cardTitle = this.t('ACTORS_CARD_TITLE', this.t('SKILL_NAME'), characterData.name);
        this.attributes.speechOutput = speechOutput;
        this.attributes.speechReprompt = speechReprompt;
        this.emit(':askWithCard', speechOutput, speechReprompt, cardTitle, speechOutput);
      }
    }

    this.attributes.speechOutput = speechOutput;
    this.attributes.speechReprompt = speechReprompt;
    this.emit(':ask', speechOutput, speechReprompt);
  },
  'AMAZON.HelpIntent': function () {
    this.attributes.speechOutput = this.t('HELP_MESSAGE');
    this.attributes.speechReprompt = this.t('HELP_REPROMPT');
    this.emit(':ask', this.attributes.speechOutput, this.attributes.speechReprompt);
  },
  'AMAZON.RepeatIntent': function () {
    this.emit(':ask', this.attributes.speechOutput, this.attributes.speechReprompt);
  },
  'AMAZON.StopIntent': function () {
    this.emit('SessionEndedRequest');
  },
  'AMAZON.CancelIntent': function () {
    this.emit('SessionEndedRequest');
  },
  'SessionEndedRequest': function () {
    this.emit(':tell', this.t('STOP_MESSAGE'));
  }
};

/**
 * Get best match from data options for a given input.
 *
 * @param {string} input - The input to match.
 * @param {Object} options - The options to match against.
 * @returns {Object|boolean}
 *   Data object or false.
 */
function getDataBestMatch (input, options) {
  input = input.toLowerCase();
  let data = false;

  // If we have an exact match, return it.
  if (options.hasOwnProperty(input)) {
    data = options[input];
  }
  // Determine best match by most intersecting parts.
  else {
    let inputParts = input.split(' ');
    let maxIntersect = 0;

    _.forIn(options, function(option, key) {
      key = key.toLowerCase();
      let keyParts = key.split(' ');
      let intersect = _.intersection(inputParts, keyParts).length;

      if (intersect > maxIntersect) {
        maxIntersect = intersect;
        data = options[key];
      }
    });
  }

  return data;
}

/**
 * Joins an array into a delimited string with an optional final delimiter.
 *
 * @param {Array} array - The array to concatenate.
 * @param {string} delimiter - The delimiter to use.
 * @param {string} delimiterLast - The optional final delimiter.
 * @returns {string}
 *   A string of concatenated array values.
 */
function arrayConcat (array, delimiter, delimiterLast) {
  delimiterLast = delimiterLast || false;
  let output = '';

  if (array.length === 1) {
    output = array[0];
  }
  else if (delimiterLast) {
    let i;

    for (i = 0; i < array.length; ++i) {
      if (i > 0) {
        if (i === array.length - 1) {
          output += delimiterLast + array[i];
        }
        else {
          output += delimiter + array[i];
        }
      }
      else {
        output += array[i];
      }
    }
  }
  else {
    output = array.join(delimiter)
  }

  return output;
}
