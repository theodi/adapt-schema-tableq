import Adapt from 'core/js/adapt';
import a11y from 'core/js/a11y';
import React from 'react';
import { templates, classes, compile } from 'core/js/reactHelpers';

export default function Schematableq(props) {
  const ariaLabels = Adapt.course.get('_globals')._accessibility._ariaLabels;

  const {
    _id,
    _isEnabled,
    _isInteractionComplete,
    _isCorrect,
    _isCorrectAnswerShown,
    _shouldShowMarking,
    _isRadio,
    displayTitle,
    body,
    instruction,
    ariaQuestion,
    onAddRow,
    onAddColumn,
    columns,
    rows
  } = props;

  return (
    <div className='component__inner schematableq__inner'>

      <templates.header {...props} />

      <div
        className={classes([
          'component__widget',
          'schematableq__widget',
          !_isEnabled && 'is-disabled',
          _isInteractionComplete && 'is-complete is-submitted show-user-answer',
          _isCorrect && 'is-correct'
        ])}
        role={_isRadio ? 'radiogroup' : 'group'}
        aria-labelledby={ariaQuestion ? null : (displayTitle || body || instruction) && `${_id}-header`}
        aria-label={ariaQuestion || null}
      >
        <div id="table" class="table-editable">
          <span class="table-add glyphicon glyphicon-plus"></span>
          <table 
            class="editableTable" 
            id={`${_id}-table`}
          >
          </table>
          <button 
              class="schematableq-button btn-text btn__action js-btn-action"
              onClick={onAddRow}
            >Add row
          </button>
          <button 
              class="schematableq-button btn-text btn__action js-btn-action"
              onClick={onAddColumn}
            >Add column
          </button>
        </div>

      </div>

      <div className='btn__container'></div>

    </div>
  );
}
