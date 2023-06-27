import QuestionView from 'core/js/views/questionView';

class SchemaTableqView extends QuestionView {

  initialize(...args) {
    this.onAddRow = this.onAddRow.bind(this);
    this.onAddColumn = this.onAddColumn.bind(this);
    super.initialize(...args);
  }

  preRender() {
    // Get file containing sample to populate table
    const sampleFile = this.model.get('sample');
    // If we have a sample file and there is no userData to load
    if (sampleFile && (!this.model.get('tableData'))) {
      fetch(sampleFile)
        .then(response => response.text())
        .then(csvData => {
          this.model.set('tableData', this.parseCSVData(csvData));
          this.renderTable();
        })
        .catch(error => {
          console.error('Error loading data:', error);
        });
    } else {
      if (!this.model.get('tableData')) {
        this.model.set('tableData', {});
      }
      this.renderTable();
    }
    const modelAnswerFile = this.model.get('modelAnswer');
    if (modelAnswerFile) {
      fetch(modelAnswerFile)
        .then(response => response.text())
        .then(csvData => {
          this.modelAnswerData = this.parseCSVData(csvData);
          this.renderModelAnswerTable();
        })
        .catch(error => {
          console.error('Error loading data:', error);
        });
    } else {
      this.model.set('_canShowModelAnswer', false);
    }
  }

  disableButtons() {
    const table = this.model.get('table');
    const parent = table.parentNode;
    const buttons = parent.querySelectorAll('button');
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].classList.add('is-disabled');
    }
  }

  renderTable() {
    const data = this.model.get('tableData');
    const tableId = `${this.model.get('_id')}-table`;
    const table = this.$(`#${tableId}`)[0];
    this.model.set('table', table);

    if (this.model.get('_isSubmitted')) {
      this.disableButtons();
    }

    const placeholderText = this.model.get('placeholderText');

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Create table headers
    const headers = Object.keys(data[0] || {});
    const headerRow = document.createElement('tr');
    const columns = Math.max(headers.length, this.model.get('columns') || 0);

    for (let i = 0; i < columns; i++) {
      const th = document.createElement('th');
      th.textContent = headers[i] || placeholderText;
      th.setAttribute('contenteditable', 'true'); // Set contenteditable attribute
      if (!headers[i]) {
        th.classList.add('placeholder');
      }
      th.addEventListener('focus', function () {
        this.classList.remove('placeholder');
        if (this.textContent === placeholderText) {
          this.textContent = '';
        }
      });

      // Add event listener to restore placeholder class and text if the cell loses focus and has no content
      th.addEventListener('blur', function () {
        if (this.textContent.trim() === '') {
          this.classList.add('placeholder');
          this.textContent = placeholderText;
        }
      });

      headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table rows
    const numRows = Math.max(this.model.get('rows') || 0, data.length);
    for (let i = 0; i < numRows; i++) {
      const tr = document.createElement('tr');

      for (let j = 0; j < columns; j++) {
        const td = document.createElement('td');
        td.textContent = data[i] ? data[i][headers[j]] || placeholderText : placeholderText;

        if (td.textContent === placeholderText) {
          td.classList.add('placeholder');
        }

        td.setAttribute('contenteditable', 'true'); // Set contenteditable attribute
        td.addEventListener('focus', function () {
          this.classList.remove('placeholder');
          if (this.textContent === placeholderText) {
            this.textContent = '';
          }
        });

        // Add event listener to restore placeholder class and text if the cell loses focus and has no content
        const self = this;
        td.addEventListener('blur', function () {
          if (self.minimumRowsReached()) {
            self.model.set('_canSubmit', true);
          }
          if (this.textContent.trim() === '') {
            this.classList.add('placeholder');
            this.textContent = placeholderText;
          }
        });
        tr.appendChild(td);

      }

      tbody.appendChild(tr);
    }

    table.appendChild(tbody);

  }

  minimumRowsReached() {
    const table = this.model.get('table');
    const placeholderText = this.model.get('placeholderText');
    const data = [];
    const rows = table.rows;
    if (rows.length < this.model.get('requiredRows')) {
      return false;
    }
    for (let i = 1; i < rows.length; i++) {
      const rowData = {};
      const cells = rows[i].cells;
      let hasValues = false; // Flag to track if the row has any non-empty cells

      // Iterate over cells
      for (let j = 0; j < cells.length; j++) {
        const cell = cells[j];
        const value = cell.innerHTML.trim();

        // Skip cells with placeholder text
        if (value !== placeholderText) {
          const columnName = table.rows[0].cells[j].innerHTML.trim();

          // Check for different data types
          if (value === 'true' || value === 'false') {
            rowData[columnName] = value === 'true';
          } else if (/^-?\d+(\.\d+)?$/.test(value)) {
            rowData[columnName] = parseFloat(value);
          } else {
            rowData[columnName] = value;
          }

          hasValues = true; // Set flag to true if a non-empty cell is found
        }
      }

      // Add row data to the array if it has at least one non-empty cell
      if (hasValues) {
        data.push(rowData);
      }
    }
    if (data.length < this.model.get('requiredRows')) {
      return false;
    }
    return true;
  }

  renderModelAnswerTable() {
    const tableId = `${this.model.get('_id')}-table`;
    const table = this.$(`#${tableId}`)[0];

    const newTable = document.createElement('table');
    newTable.setAttribute('class', 'modelAnswer');
    newTable.setAttribute('id', this.model.get('_id') + '-modelAnswer');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Create table headers
    const headers = Object.keys(this.modelAnswerData[0]);
    const headerRow = document.createElement('tr');

    headers.forEach((header) => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    newTable.appendChild(thead);

    // Create table rows
    const numRows = this.modelAnswerData.length;
    for (let i = 0; i < numRows; i++) {
      const tr = document.createElement('tr');

      headers.forEach((header) => {
        const td = document.createElement('td');
        td.textContent = this.modelAnswerData[i]?.[header];
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    }
    newTable.appendChild(tbody);

    table.insertAdjacentElement('afterend', newTable);

  }

  onAddRow(event) {
    const placeholderText = this.model.get('placeholderText');
    const button = event.target; // Get the button element that triggered the event

    // Check if the button has the 'is-disabled' class
    if (button.classList.contains('is-disabled')) {
      // Button is disabled, do not proceed
      return;
    }

    const tableId = `${this.model.get('_id')}-table`;
    const table = this.$(`#${tableId}`)[0];

    const maxRows = this.model.get('maxRows'); // Get the maxRows value from your model (if defined)

    // Check if the maxRows value is defined and the number of rows exceeds it
    if (maxRows !== undefined && table.rows.length - 1 >= maxRows) {
      alert('You have reached the maximum number of permitted rows.');
      return; // Return early if the maximum number of rows is reached
    }
    const newRow = table.insertRow();
    const numColumns = table.rows[0].cells.length;
    for (let i = 0; i < numColumns; i++) {
      const newCell = newRow.insertCell();
      newCell.classList.add('placeholder');
      newCell.contentEditable = true; // Enable editing for the cell
      newCell.innerHTML = placeholderText; // Set the initial value to placeholder text

      // Add event listener to remove placeholder class and clear text when the cell is focused
      newCell.addEventListener('focus', function () {
        this.classList.remove('placeholder');
        if (this.innerHTML === placeholderText) {
          this.innerHTML = '';
        }
      });

      // Add event listener to restore placeholder class and text if the cell loses focus and has no content
      newCell.addEventListener('blur', function () {
        if (this.innerHTML.trim() === '') {
          this.classList.add('placeholder');
          this.innerHTML = placeholderText;
        }
      });
    }
  }

  onAddColumn(event) {
    const placeholderText = this.model.get('placeholderText');
    const button = event.target; // Get the button element that triggered the event

    // Check if the button has the 'is-disabled' class
    if (button.classList.contains('is-disabled')) {
      // Button is disabled, do not proceed
      return;
    }

    const tableId = `${this.model.get('_id')}-table`;
    const table = this.$(`#${tableId}`)[0];

    const maxColumns = this.model.get('maxColumns'); // Get the maximum number of columns from the model

    // Check if maxColumns is defined and the current number of columns does not exceed the maximum
    if (maxColumns && table.rows[0].cells.length >= maxColumns) {
      alert('You have reached the maximum number of permitted columns.');
      return;
    }

    // Iterate through each row in the table
    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];

      // Create a new cell at the end of the row
      const newCell = row.insertCell();

      // Enable editing for the new cell
      newCell.contentEditable = true;
      newCell.classList.add('placeholder');

      // Set the initial value to blank
      newCell.innerHTML = placeholderText;

      // Add event listener to remove placeholder class and clear text when the cell is focused
      newCell.addEventListener('focus', function () {
        this.classList.remove('placeholder');
        if (this.innerHTML === placeholderText) {
          this.innerHTML = '';
        }
      });

      // Add event listener to restore placeholder class and text if the cell loses focus and has no content
      newCell.addEventListener('blur', function () {
        if (this.innerHTML.trim() === '') {
          this.classList.add('placeholder');
          this.innerHTML = placeholderText;
        }
      });

      // Set the first row as a header (th)
      if (i === 0) {
        const newHeader = document.createElement('th');
        newHeader.contentEditable = true;
        newHeader.classList.add('placeholder');
        newHeader.innerHTML = placeholderText;
        // Add event listener to remove placeholder class and clear text when the cell is focused
        newHeader.addEventListener('focus', function () {
          this.classList.remove('placeholder');
          if (this.innerHTML === placeholderText) {
            this.innerHTML = '';
          }
        });

        // Add event listener to restore placeholder class and text if the cell loses focus and has no content
        newHeader.addEventListener('blur', function () {
          if (this.innerHTML.trim() === '') {
            this.classList.add('placeholder');
            this.innerHTML = placeholderText;
          }
        });
        row.replaceChild(newHeader, newCell);
      }
    }
  }

  setupQuestion() {
  }

  onQuestionRendered() {
    this.setReadyStatus();
    // this.model.set('_canSubmit',true);
  }

  // Used by the question view to reset the look and feel of the component.
  resetQuestion() {
    this.model.resetItems();
  }

  showCorrectAnswer() {
    const tableId = `${this.model.get('_id')}-table`;
    const table = this.$(`#${tableId}`)[0];
    const parent = table.parentNode;
    const modelAnswerTable = parent.getElementsByClassName('modelAnswer')[0];

    if (modelAnswerTable) {
      table.style.display = 'none';
      modelAnswerTable.style.display = 'inline-table';
    }
  }

  hideCorrectAnswer() {
    const tableId = `${this.model.get('_id')}-table`;
    const table = this.$(`#${tableId}`)[0];
    const parent = table.parentNode;
    const modelAnswerTable = parent.getElementsByClassName('modelAnswer')[0];

    if (modelAnswerTable) {
      table.style.display = 'inline-table';
      modelAnswerTable.style.display = 'none';
    }
  }

  parseCSVData(csvData) {
    // Parse the CSV data into an array of objects
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].split(',');
      const item = {};
      for (let j = 0; j < headers.length; j++) {
        item[headers[j].trim()] = line[j].trim();
      }

      result.push(item);
    }

    return result;
  }

}

SchemaTableqView.template = 'schematableq.jsx';

export default SchemaTableqView;
