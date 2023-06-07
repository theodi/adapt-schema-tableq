import QuestionView from 'core/js/views/questionView';

class SchemaTableqView extends QuestionView {

  initialize(...args) {
    this.onAddRow = this.onAddRow.bind(this);
    this.onAddColumn = this.onAddColumn.bind(this);
    super.initialize(...args);
  }

  preRender() {
    //Get file containing sample to populate table
    var sampleFile = this.model.get('sample');
    //If we have a sample file and there is no userData to load
    if (sampleFile && (!this.model.get('tableData'))) {
      fetch(sampleFile)
        .then(response => response.text())
        .then(csvData => {
          this.model.set('tableData',this.parseCSVData(csvData));
          this.renderTable();
        })
        .catch(error => {
          console.error('Error loading data:', error);
        });
    } else {
      if (!this.model.get('tableData')) {
        this.model.set('tableData',{});
      }
      this.renderTable();
    }
    var modelAnswerFile = this.model.get('modelAnswer');
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
      this.model.set('_canShowModelAnswer',false)
    }
  }

  renderTable() {
    var data = this.model.get('tableData');
    var tableId = `${this.model.get('_id')}-table`;
    var table = this.$(`#${tableId}`)[0];
    this.model.set('table',table);

    var placeholderText = this.model.get('placeholderText');

    var thead = document.createElement('thead');
    var tbody = document.createElement('tbody');

    // Create table headers
    var headers = Object.keys(data[0] || {});
    var headerRow = document.createElement('tr');
    var columns = Math.max(headers.length, this.model.get('columns') || 0);

    for (var i = 0; i < columns; i++) {
      var th = document.createElement('th');
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
    var numRows = Math.max(this.model.get('rows') || 0, data.length);
    for (let i = 0; i < numRows; i++) {
      var tr = document.createElement('tr');

      for (var j = 0; j < columns; j++) {
        var td = document.createElement('td');
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
        td.addEventListener('blur', function () {
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

  renderModelAnswerTable() {
    var tableId = `${this.model.get('_id')}-table`;
    var table = this.$(`#${tableId}`)[0];
    var parent = table.parentNode;

    var newTable = document.createElement('table');
    newTable.setAttribute('class','modelAnswer');
    newTable.setAttribute('id',this.model.get('_id') + '-modelAnswer');
    var thead = document.createElement('thead');
    var tbody = document.createElement('tbody');

    // Create table headers
    var headers = Object.keys(this.modelAnswerData[0]);
    var headerRow = document.createElement('tr');

    headers.forEach((header) => {
      var th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    newTable.appendChild(thead);

    // Create table rows
    var numRows = this.modelAnswerData.length;
    for (let i = 0; i < numRows; i++) {
      var tr = document.createElement('tr');

      headers.forEach((header) => {
        var td = document.createElement('td');
        td.textContent = this.modelAnswerData[i]?.[header];
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    }
    newTable.appendChild(tbody);
    
    table.insertAdjacentElement('afterend', newTable);

  }

  onAddRow(event) {
    var placeholderText = this.model.get('placeholderText');
    var button = event.target; // Get the button element that triggered the event

    // Check if the button has the 'is-disabled' class
    if (button.classList.contains('is-disabled')) {
      // Button is disabled, do not proceed
      return;
    }

    var tableId = `${this.model.get('_id')}-table`;
    var table = this.$(`#${tableId}`)[0];

  
    const maxRows = this.model.get('maxRows'); // Get the maxRows value from your model (if defined)

    // Check if the maxRows value is defined and the number of rows exceeds it
    if (maxRows !== undefined && table.rows.length-1 >= maxRows) {
      alert('You have reached the maximum number of permitted rows.')
      return; // Return early if the maximum number of rows is reached
    }
    var newRow = table.insertRow();
    var numColumns = table.rows[0].cells.length;
    for (let i = 0; i < numColumns; i++) {
      var newCell = newRow.insertCell();
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
    var placeholderText = this.model.get('placeholderText');
    var button = event.target; // Get the button element that triggered the event

    // Check if the button has the 'is-disabled' class
    if (button.classList.contains('is-disabled')) {
      // Button is disabled, do not proceed
      return;
    }

    var tableId = `${this.model.get('_id')}-table`;
    var table = this.$(`#${tableId}`)[0];


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
    //this.model.set('_canSubmit',true);
  }

  // Used by the question view to reset the look and feel of the component.
  resetQuestion() {
    this.model.resetItems();
  }

  showCorrectAnswer() {
    var tableId = `${this.model.get('_id')}-table`;
    var table = this.$(`#${tableId}`)[0];
    var parent = table.parentNode;
    var modelAnswerTable = parent.getElementsByClassName('modelAnswer')[0];

    if (modelAnswerTable) {
      table.style.display = 'none';    
      modelAnswerTable.style.display = 'inline-table';  
    }
  }

  hideCorrectAnswer() {
    var tableId = `${this.model.get('_id')}-table`;
    var table = this.$(`#${tableId}`)[0];
    var parent = table.parentNode;
    var modelAnswerTable = parent.getElementsByClassName('modelAnswer')[0];

    if (modelAnswerTable) {
      table.style.display = 'inline-table';
      modelAnswerTable.style.display = 'none';  
    }
  }

  parseCSVData(csvData) {
    // Parse the CSV data into an array of objects
    var lines = csvData.trim().split('\n');
    var headers = lines[0].split(',');
    var result = [];
  
    for (var i = 1; i < lines.length; i++) {
      var line = lines[i].split(',');
      var item = {};
      for (var j = 0; j < headers.length; j++) {
        item[headers[j].trim()] = line[j].trim();
      }

      result.push(item);
    }

    return result;
  }

}

SchemaTableqView.template = 'schematableq.jsx';

export default SchemaTableqView;
