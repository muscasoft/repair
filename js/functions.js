// v2 version check included
const ncVersion = document.getElementById('ncVersion');
const updateRunning = document.getElementById('updateRunning');
const diskStatistics = document.getElementById('diskStatistics');
const backups  = document.getElementById('backups');
const setupChecks = document.getElementById('setupChecks');
const logData = document.getElementById('logData');
const logNC = document.getElementById('logNC');
updateNCVersion();
updateUpdateRunning();
updateDiskStatistics();
updateBackups();
updateSetupChecksStart();
updateLogNC();

async function updateNCVersion() {
  $.ajax({
    type: 'POST',
    url: 'php/main.php',
    data: { action: 'GetNCVersion'},
    success: function(returnValue) {
      ncVersion.innerText = returnValue;
    },
    error: function(returnValue) {
      alert('Version not available.\n' + returnValue);
    }
  })
}

async function updateUpdateRunning() {
  $.ajax({
    type: 'POST',
    url: 'php/main.php',
    data: { action: 'IsUpdateRunning'},
    success: function(returnValue) {
      if (returnValue) {
        updateRunning.innerText = 'Update running          ';
        const resetUpdateRunning = parent.document.createElement('button');
        resetUpdateRunning.innerText = 'Reset update';
        resetUpdateRunning.addEventListener('click', function(){ resetRunningUpdate() } );
        updateRunning.appendChild(resetUpdateRunning);   
      }
      else {
        updateRunning.innerText = 'No update running';     
      }
    },
    error: function(returnValue) {
      alert('Update information not available.\n' +returnValue);
    }
  })
}

async function updateDiskStatistics() {
  $.ajax({
    type: 'POST',
    url: 'php/main.php',
    data: { action: 'GetDiskStatistics'},
    success: function(returnValue) {
        diskStatistics.innerText = (returnValue / 1000000).toLocaleString('nl-nl', {maximumFractionDigits: 1}) + ' MB';
    },
    error: function(returnValue) {
      diskStatistics.innerText = 'No disk statistics available'
      alert('Error while getting disk statistics.\n' + returnValue);
    }
  })
}

function updateBackups() {
  const backupButtonGroup = document.createElement('div');
  backupButtonGroup.className = 'backupButtonGroup';

  const latestBackup = parent.document.createElement('div');
  latestBackup.id = 'latestBackup';
  latestBackup.innerText = 'Please wait again';
  latestBackup.addEventListener('click', makeBackup);
  backupButtonGroup.appendChild(latestBackup);

  const makeBackupButton = parent.document.createElement('button');
  makeBackupButton.id = 'makeBackup';
  makeBackupButton.innerText = 'Make backup';
  makeBackupButton.style.marginRight = '10px';
  makeBackupButton.addEventListener('click', makeBackup);
  backupButtonGroup.appendChild(makeBackupButton);

  const listBackupsButton = parent.document.createElement('button');
  listBackupsButton.id = 'listBackups';
  listBackupsButton.innerText = 'List backups';
  listBackupsButton.style.marginRight = '10px';
  listBackupsButton.addEventListener('click', listBackups);
  backupButtonGroup.appendChild(listBackupsButton);

  const deleteBackupsButton = parent.document.createElement('button');
  deleteBackupsButton.id = 'deleteBackups';
  deleteBackupsButton.innerText = 'Delete backups';
  deleteBackupsButton.addEventListener('click', selectBackups);
  backupButtonGroup.appendChild(deleteBackupsButton);

  backups.innerText = '';
  backups.append(backupButtonGroup);
  
  updateLastBackupTime();
}

async function updateLastBackupTime() {
  $.ajax({
    type: 'POST',
    url: 'php/main.php',
    data: { action: 'GetLatestBackupFile'},
    success: function(returnValue) {
      const latestBackup = document.getElementById('latestBackup');
      latestBackup.innerText = 'Last back-up date is ' + returnValue.last_modified;
    },
    error: function(returnValue) {
      latestBackup.innerText = 'No last back-up date known.';
    }
  })
}

async function makeBackup() {
  $.ajax({
    type: 'POST',
    url: 'php/main.php',
    data: { action: 'MakeBackupDatabase'},
    success: function(returnValue) {
      alert('Back-up successfull');
      updateLastBackupTime();
    },
    error: function(returnValue) {
      alert('Back-up not successfull.\n' + returnValue);
    }
  })
}

async function listBackups() {
  $.ajax({
    type: 'POST',
    url: 'php/main.php',
    data: { action: 'ListBackupFiles'},
    success: function(returnValue) {
      listBackupFilesInPopupWindows(returnValue);
    },
    error: function(returnValue) {
      alert('No back-up files found.\n');
    }
  })
}

function listBackupFilesInPopupWindows(files)
{
  if (files.length == 0) {
    alert('No back-up files found');
    return;
  }
  
  const listBackupsButton = document.getElementById('listBackups');
  listBackupsButton.disabled = true;

  const modal = document.createElement('div');
  Object.assign(modal.style, {
      position: 'fixed',
      top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1,
  });

  const content = document.createElement('div');
  Object.assign(content.style, {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      width: '50%',
      maxWidth: '80%',
      minWidth: '200px',
      maxHeight: '80vh',
      overflowY: 'auto',
      resize: 'horizontal',
      overflow: 'auto',
      boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column'
  });
  
  modal.tabIndex = -1;

  const ul = document.createElement('ul');
  files.forEach(f => {
      const li = document.createElement('li');
      li.textContent = f.name;
      ul.appendChild(li);
  });
  content.appendChild(ul);

  const okBtn = document.createElement('button');
  okBtn.textContent = 'OK';
  Object.assign(okBtn.style, {marginTop: '20px', padding: '6px 12px', alignSelf: 'flex-end'});
  okBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
      listBackupsButton.disabled = false;
      listBackupsButton.focus();
  });
  content.appendChild(okBtn);

  modal.appendChild(content);

  window.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
          e.preventDefault(); // voorkom tab buiten modal
      } else if (e.key === 'Escape') {
          document.body.removeChild(modal);
          listBackupsButton.disabled = false;
          listBackupsButton.focus();
      }
  });

  document.body.appendChild(modal);
}

async function selectBackups() {
  $.ajax({
    type: 'POST',
    url: 'php/main.php',
    data: { action: 'ListBackupFiles'},
    success: function(returnValue) {
      filenamesWithHashes = returnValue;
      selectBackupFilesInPopupWindows(filenamesWithHashes)
        .then((selectedNames) => {
          const filteredFilenamesWithHashes = filenamesWithHashes.filter(file => selectedNames.includes(file.name));
          deleteBackups(filteredFilenamesWithHashes);
          updateLastBackupTime();
        });
    },
    error: function(returnValue) {
      alert('No back-up files found.\n');
    }
  })
}

function selectBackupFilesInPopupWindows(filenamesWithHashes)
{
  return new Promise((resolve) => {
    if (filenamesWithHashes.length == 0) {
      alert('No back-up files found');
      return;
    }
    
    const deleteBackupsButton = document.getElementById('deleteBackups');
    deleteBackupsButton.disabled = true;

    const modal = document.createElement('div');
    Object.assign(modal.style, {
        position: 'fixed',
        top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1,
    });

    const content = document.createElement('div');
    Object.assign(content.style, {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        width: '50%',
        maxWidth: '80%',
        minWidth: '200px',
        maxHeight: '80vh',
        overflowY: 'auto',
        resize: 'horizontal',
        overflow: 'auto',
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column'
    });
    
    modal.tabIndex = -1;

    const form = document.createElement('form');
    filenamesWithHashes.forEach((fileWithHash, idx) => {
        const label = document.createElement('label');
        label.style.display = 'block';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = fileWithHash.name;
        cb.id = "checkbox_${idx}";
        label.appendChild(cb);
        label.appendChild(document.createTextNode(' ' + fileWithHash.name));
        form.appendChild(label);
    });
    content.appendChild(form);

    const okBtn = document.createElement('button');
    okBtn.textContent = 'OK';
    Object.assign(okBtn.style, {marginTop: '20px', padding: '6px 12px', alignSelf: 'flex-end'});
    okBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const checked = Array.from(form.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.value);
        document.body.removeChild(modal);
        deleteBackupsButton.disabled = false;
        deleteBackupsButton.focus();
        resolve(JSON.stringify(checked));
    });
    content.appendChild(okBtn);

    modal.appendChild(content);

    window.addEventListener('keydown', e => {
        if (e.key === 'Tab') {
            e.preventDefault(); // voorkom tab buiten modal
        } else if (e.key === 'Escape') {
            document.body.removeChild(modal);
            deleteBackupsButton.disabled = false;
            deleteBackupsButton.focus();
        }
    });

    document.body.appendChild(modal);
  });
}

async function deleteBackups(filteredFilenamesWithHashes) {
  $.ajax({
    type: 'POST',
    url: 'php/main.php',
    data: { 
      action: 'DeleteBackupFiles' ,
      FilenamesWithHashes: JSON.stringify(filteredFilenamesWithHashes)
    },
    datatype: 'json',
    success: function(returnValue) {
      alert(returnValue);
    },
    error: function(returnValue) {
      alert('No back-up files found.\n' . returnValue);
    }
  })
}

async function resetRunningUpdate(id) {
  $.ajax({
    type: 'POST',
    url: 'php/main.php',
    data: { action: 'ResetUpdateRunning'},
    success: function(returnValue) {
      alert ('Reset successfull\n');
      updateRunning.innerText = 'No update running';     
    },
    error: function(returnValue) {
      alert('Repair not successfull.\n' + returnValue);
    }
  })
}


function ajaxPost(action) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'POST',
      url: 'php/main.php',
      data: { action },
      success: data => resolve(data),
      error: err => reject(err)
    });
  });
}

async function updateSetupChecksStart() {
  try {
    const [knownSetupChecks, skipRepairSetupChecks, setupChecks] = await Promise.all([
      ajaxPost('DefinedActions'),
      ajaxPost('SkipRepairSetupChecks'),
      ajaxPost('GetSetupChecks')
    ]);

    processSetupChecks(setupChecks, knownSetupChecks, skipRepairSetupChecks);
  } catch (err) {
    alert('Repair not successful.\n' + err.responseText);
  }
}

function processSetupChecks(mySetupChecks, knownSetupChecks, skipRepairSetupChecks) { 
  setupChecks.innerText = '';
  
  const warningsSection = parent.document.createElement('div');
  warningsSection.className = 'warnings';
  warningsSection.id = 'warnings';
  setupChecks.appendChild(warningsSection);
  
  const infoSection = parent.document.createElement('div');
  infoSection.className = 'info';
  infoSection.id = 'info';
  setupChecks.appendChild(infoSection);

  for (let i = 0; i < mySetupChecks.length - 1; i++) {
    const idArray = mySetupChecks[i].id.split('\\');
    const id = idArray[idArray.length - 1];
    const isSetupCheckDefined = (id in knownSetupChecks);
    const isRepairDefined = isSetupCheckDefined ? knownSetupChecks[id] : false;
    const skipRepairSetupCheck = skipRepairSetupChecks.includes(id);

    const setupCheckSection = parent.document.createElement('div');
    setupCheckSection.id = id;

    const setupCheckName = parent.document.createElement('h2');
    setupCheckName.innerText = mySetupChecks[i].name + '          ';
    
    if (!skipRepairSetupCheck) {
      if (isRepairDefined) {
        const setupCheckButton = parent.document.createElement('button');
        setupCheckButton.innerText = 'repair';
        setupCheckButton.addEventListener('click', function(){ startPhpFunction(id) } );
        setupCheckName.appendChild(setupCheckButton);
      }

      const setupCheckDescription = parent.document.createElement('p');
      setupCheckDescription.innerText = mySetupChecks[i].description;
      
      setupCheckSection.appendChild(setupCheckName);
      setupCheckSection.appendChild(setupCheckDescription);

      const severitySection = mySetupChecks[i].severity == 'warning' ? warningsSection : infoSection;
      severitySection.appendChild(setupCheckSection);

      addToLogData(mySetupChecks[mySetupChecks.length - 1]); 
    }     
  }
}

async function startPhpFunction(id) {
  $.ajax({
    type: 'POST',
    url: 'php/main.php',
    data: { action: id},
    success: function(returnValue) {
      alert ('Repair successfull\n')
      addToLogData(returnValue);
      const setupCheckSection = document.getElementById(id);
      setupCheckSection.style.textDecoration = "line-through";
    },
    error: function(returnValue) {
      alert('Repair not successfull.\n' + returnValue);
    }
  })
}

function addToLogData(logText) {
  logData.innerText = logData.innerText == '-' ?  '' : '-----------\n' + logData.innerText;
  logData.innerText = JSON.stringify(logText, '##', 2) + logData.innerText;
}

function updateLogNC() {
  // Event listeners

  buildLogNCTable();
  loadNCLogs();
}

function buildLogNCTable() {
  const daysLabel = document.createElement('label');
  daysLabel.setAttribute('for','daysSelect');
  daysLabel.textContent = 'Number of days to select:';
  logNC.appendChild(daysLabel);

  const daysSelect = document.createElement('select');
  daysSelect.id = 'daysSelect';
  logNC.appendChild(daysSelect);

  for(let i=1; i<=30; i++){
    const day = document.createElement('option');
    day.value = i;
    day.textContent = i;
    daysSelect.appendChild(day);
  }

  daysSelect.addEventListener('change', renderNCLogs);
  daysSelect.value = 10; // start value 10 days

  const fieldset = document.createElement('fieldset');
  fieldset.style.marginTop = '10px';
  fieldset.style.marginBottom = '10px';
  fieldset.style.display = 'flex';
  fieldset.style.alignItems = 'center';
  fieldset.style.flexWrap = 'wrap';

  const legend = document.createElement('legend');
  legend.textContent = 'Filter on level:';
  fieldset.appendChild(legend);

  const levels = [
    {val:1, text:'Info'},
    {val:2, text:'Warning'},
    {val:3, text:'Error'},
    {val:4, text:'Fataal'}
  ];

  levels.forEach(level=>{
    const label = document.createElement('label');
    label.style.marginRight = '10px';
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.lineHeight = '1.2'

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'levelCheckbox';
    checkbox.value = level.val;
    checkbox.checked = level.val>2;
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' ' + level.text));
    
    fieldset.appendChild(label);
  });

  const levelCheckboxes = fieldset.querySelectorAll('.levelCheckbox');
  levelCheckboxes.forEach(checkbox => checkbox.addEventListener('change', renderNCLogs));

  logCounter = document.createElement('p');
  logCounter.id = 'logCounter';
  logCounter.style.marginLeft = '40px';
  logCounter.style.lineHeight = '1.2';
  logCounter.style.alignSelf = 'flex-start';

  fieldset.appendChild(logCounter);

  logNC.appendChild(fieldset);

  const logTable = document.createElement('table');
  logTable.id = 'logTable';

  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  ['Tijd','Level','App','User','Message'].forEach(columnTitle=>{
      const th = document.createElement('th');
      th.textContent = columnTitle;
      trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  logTable.appendChild(thead);

  const tbody = document.createElement('tbody');
  logTable.appendChild(tbody);

  logNC.appendChild(logTable);  
}

async function loadNCLogs() {
  $.ajax({
    type: 'POST',
    url: 'php/main.php',
    data: { action: 'GetLogData'},
    success: function(returnValue) {
        // Log level must be saved as an integer
        logs = returnValue.map(log => ({ ...log, level: parseInt(log.level) }));
        renderNCLogs();
    },
    error: function(returnValue, status, error) {
        console.error('Error retrieving the logs:', status, error);
    }
  })
}

function renderNCLogs() {
  const daysSelect = document.getElementById('daysSelect');
  const days = parseInt(daysSelect.value);

  const levelCheckboxes = document.querySelectorAll('.levelCheckbox');
  const selectedLevels = Array.from(levelCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => parseInt(checkbox.value));

  const now = new Date();
  const cutoff = new Date(now.getTime() - days*24*60*60*1000);

  const tbody = document.querySelector('#logTable tbody');
  tbody.innerHTML = '';

  const filtered = logs
      .filter(log => new Date(log.time) >= cutoff && selectedLevels.includes(log.level))
      .sort((Date1,Date2) => new Date(Date2.time) - new Date(Date1.time));

  let logCounter = document.getElementById('logCounter');
  logCounter.textContent = `Total filtered logs: ${filtered.length}`;

  filtered.forEach(log => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
          <td>${formatDate(log.time)}</td>
          <td class="level-${log.level}">${log.level}</td>
          <td>${log.app}</td>
          <td>${log.user}</td>
          <td>${log.message}</td>
      `;
      tbody.appendChild(tr);
  });
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const yyyy = date.getFullYear();
    const dd = String(date.getDate()).padStart(2,'0');
    const mm = String(date.getMonth()+1).padStart(2,'0');
    const hh = String(date.getHours()).padStart(2,'0');
    const min = String(date.getMinutes()).padStart(2,'0');
    const ss = String(date.getSeconds()).padStart(2,'0');
    return `${yyyy}-${dd}-${mm} ${hh}:${min}:${ss}`;
}