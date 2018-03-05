

var manager;

/* helper functions*/

function getId(event) {
  return $(event.target).closest('tr').attr('data-id');
}

function moveCompleted() {
  var $rows = $('#right table tr');

  $rows.each(function() {
    var $row = $(this);
    
    if ($row.find('input[type=checkbox]').is(':checked')) {
      $toDoList.append($row);
    }
  });
}

function formatDate(todo) {
  var date = 'No due date',
      toDo = todo || this.curToDo;
  if (toDo.due_month !== ''  && toDo.due_year !== '') {
    date = toDo.due_month + '/' + toDo.due_year;
  }

  return date;
}

function compareDates(todo1, todo2) {
  return Number(todo1.due_year) < Number(todo2.due_year) ? -1 : Number(todo1.due_year) > Number(todo2.due_year) ? 1 : Number(todo1.due_month) < +Number(todo2.due_month) ? -1 : Number(todo1.due_month) > Number(todo2.due_month) ? 1 : 0;
}

/* ToDo Contstructor*/

function ToDo(title, due_day, due_month, due_year, description, id) {
  this.title = title || '';
  this.due_day = due_day || '';
  this.due_month = due_month || ''; 
  this.due_year = due_year || '';
  this.description = description || '';
  this.id = id;
  this.complete = false;
  this.due_date = '';
}

/*Collections*/

function ToDosObject() {
  this.collection = [];
  this.completed = [];
  this.toDosByDate = {};
  this.completedToDosByDate = {};
  this.lastId = 0;
}

ToDosObject.prototype = {
  makeToDo: function() {
    var toDo = new ToDo('', '', '', '', '', this.lastId);
    this.lastId++;
    this.collection.push(toDo);
    return toDo;
  },
  remove: function(id) {
    var idx;

    this.collection.forEach(function(todo, index) {
      if (Number(todo.id) === Number(id)) {
        idx = index;
      }
    });

    this.collection.splice(idx, 1);
  },
  get: function(id) {
    return this.collection.filter(function(todo) {
      return Number(todo.id) === Number(id);
    }).pop();
  },
  setCompleted: function() {
    this.completed = this.collection.filter(function(todo) {
      return todo.complete;
    });
  },
  sortByDate: function(collection) {
    var newCollection = collection.filter(function(todo) {
      return todo.due_date !== 'No due date';
    }).sort(compareDates);

    return collection.filter(function(todo) {
      return todo.due_date === 'No due date';
    }).concat(newCollection);
  },
  groupByDate: function(storageObj, collection) {
    this[storageObj] = {};
    var obj = this[storageObj]
    this.sortByDate(collection).forEach(function(todo) {
      var subCollection =  obj[formatDate(todo)];
      subCollection && subCollection.indexOf(todo) === -1 ? obj[formatDate(todo)].push(todo) : (obj[formatDate(todo)] = [], obj[formatDate(todo)].push(todo));
    });
  }, 
}

/*UI Object*/

var UI = {
  displayHeaderData: function(headerData) {
    $('#main-header').html('');
    $('#main-header').append(headerScript(headerData));
  },
  displayToDos: function(todos) {
    $toDoList.html('');
    $toDoList.append(toDoItemScript({toDoArray: todos})); 
  },
  displayToDosByDate: function(todosObj) { 
    var collection = manager.toDos.collection;
    $allList.html('');
    $allList.append(allToDosScript({todosObj}));
    $("#all-header").html('')
    $('#all-header').append(todosHeaderScript(collection));
  },
  displayCompletedToDosByDate: function(todosObj) {
    var collection = manager.toDos.completed;
    $completedList.html('');
    $completedList.append(allListScript({todosObj}));
    $('#completed-todos').html('');
    $('#completed-todos').append(completedHeaderScript(collection));

  },
  renderForm: function(todo) {
    $formModal.find('input[name=title]').val(todo.title);
    $formModal.find('#due_day').val(todo.due_day);
    $formModal.find('#due_month').val(todo.due_month);
    $formModal.find('#due_year').val(todo.due_year);
    $formModal.find('textarea[name=description]').val(todo.description);
  },
  showForm: function() {
    $allModals.show();
  },
  formDone: function() {
    document.getElementById('todo-form').reset();
    $allModals.hide();
  },
}

/* Manager [EVENTS] */

function Manager() {
  this.toDos = new ToDosObject();
  this.curToDo = '';
  this.curSelectedList = 'All-Header';
  this.curTitle = '';
}

Manager.prototype = {
  setSelectedList: function(section, title) {
    if (section === 'All-Header') {
      $("#all-header").trigger('click');
    } else if (section === 'Completed-Header') {
      $("#completed-list-header").trigger('click');
    } else if (section === 'All-List-Item') {
      $('#all-list').find('dl').filter(function(i, list){
        return $(list).attr('data-title') === title;
      }).trigger('click');
    } else {
      if(this.toDos.completedToDosByDate.hasOwnProperty(this.curTitle)) {
        var $list = $("#completed-list dl").filter(function() {
          return $(this).attr('data-title') === title;
        });
        console.log($list);
        console.log($('#completed-list dl'));
        $list.trigger('click');
      } else {
        $("#all-todos-list").trigger('click');
      }
    }
  },
  processListSelection: function(event) {
    var $list = $(event.currentTarget),
        $parent = $list.closest('#left'),
        identifer = $($list).closest('article').attr('id'),
        headerData = {title: $list.attr('data-title'),
                      total: $list.attr('data-total'),
                      },
        itemsData;

        if (identifer === 'completed-list') {
          itemsData = manager.toDos.completedToDosByDate[$list.attr('data-title')];
        } else if (identifer === 'all-list') {
         itemsData = manager.toDos.toDosByDate[$list.attr('data-title')];
        }

    $parent.find('.active').removeClass('active');
    $list.addClass('active');

    UI.displayHeaderData(headerData);

    if (headerData.title === 'All Todos') {
      UI.displayToDos(manager.toDos.collection);
    } else if (headerData.title === 'completed') {
      UI.displayToDos(manager.toDos.completed);
    } else {
      UI.displayToDos(itemsData);
    }

    this.curSelectedList = $list.attr('id') === 'all-todos-list' ? 'All-Header' : $list.attr('id') === 'completed-list-header' ? 'Completed-Header' : $list.closest('article').attr('id') === 'all-list' ? 'All-List-Item' : 'Complete-List-Item';
    this.curTitle = $list.attr('data-title');
  },
  processNewToDo: function() {
    var toDo = this.toDos.makeToDo();
    this.curToDo = toDo;
    UI.showForm()
  },  
  toggleComplete: function(event) {
    var id = getId(event);
    this.curToDo = this.toDos.get(id);
    this.curToDo.complete = !this.curToDo.complete;
    this.toDos.setCompleted();
    this.toDos.groupByDate('completedToDosByDate', this.toDos.completed);
    UI.displayToDos(this.toDos.collection);
    UI.displayCompletedToDosByDate(this.toDos.completedToDosByDate);
    moveCompleted();
    this.setSelectedList(this.curSelectedList, this.curTitle);
  },
  markComplete: function(event) {
    event.preventDefault();
    this.curToDo.complete = true;
    this.toDos.setCompleted();
    this.toDos.groupByDate('completedToDosByDate', this.toDos.completed);
    UI.displayCompletedToDosByDate(this.toDos.completedToDosByDate);
    this.renderToDo(event);
    this.setSelectedList(this.curSelectedList, this.curTitle);
  },
  renderToDo: function(event) {
    event.preventDefault();
    var toDo = this.curToDo;
        toDo.title = $formModal.find('input[name=title]').val();
        toDo.due_day = $formModal.find('#due_day').val();
        toDo.due_month = $formModal.find('#due_month').val();
        toDo.due_year = $formModal.find('#due_year').val();
        toDo.description = $formModal.find('textarea[name=description]').val();
        toDo.due_date = formatDate(toDo);

    this.toDos.groupByDate('toDosByDate', this.toDos.collection);
    UI.displayToDos(this.toDos.collection);
    UI.displayToDosByDate(this.toDos.toDosByDate);
    UI.formDone();
    $("#all-todos-list").trigger('click');
    moveCompleted();
  },
  editToDo:function(event) {
    event.preventDefault();
    event.stopPropagation();
    var id = getId(event);
    this.curToDo = this.toDos.get(id);
    UI.renderForm(this.curToDo);
    UI.showForm();
  },
  deleteToDo: function(event) {
    var id = getId(event);
    this.toDos.remove(id);
    this.toDos.setCompleted();
    this.toDos.groupByDate('toDosByDate', this.toDos.collection);
    this.toDos.groupByDate('completedToDosByDate', this.toDos.completed);
    UI.displayToDos(this.toDos.collection);
    UI.displayToDosByDate(this.toDos.toDosByDate);
    UI.displayCompletedToDosByDate(this.toDos.completedToDosByDate);
  },
  storeData: function() {
    var collection = JSON.stringify(this.toDos.collection),
        completed = JSON.stringify(this.toDos.completed),
        toDosByDate = JSON.stringify(this.toDos.toDosByDate),
        completedToDosByDate = JSON.stringify(this.toDos.completedToDosByDate);

    localStorage.setItem('collection', collection);
    localStorage.setItem('lastId', this.toDos.lastId);
    localStorage.setItem('completed', completed);
    localStorage.setItem('toDosByDate', toDosByDate);
    localStorage.setItem('completedToDosByDate', completedToDosByDate);
  },
}

/*SETUP*/

var SETUP =  {
  init: function() {
    this.registerElements();
    this.registerTemplates();
    this.bindEvents();
    this.restoreData();

    moveCompleted();
  },
  registerElements: function() {
    $allModals = $('.modal');
    $formModal = $('#form_modal');
    $addNewToDo = $('label[name=new_item]');
    $submitToDoBtn = $('input[type=submit]');
    $toDoList = $('#todo-list');
    $amountDisplay = $('.todo-length');
    $completedAmountDisplay = $('.completed-amount')
    $completeBtn = $('button[name=complete]');
    $allList = $('#all');
    $completedList = $('#completed-list');
  },
  registerTemplates: function() {
    toDoItemScript = Handlebars.compile($('#todo-temp').html());
    allToDosScript = Handlebars.compile($('#all-todos-temp').html());
    allListScript = Handlebars.compile($('#all-list-temp').html());
    todosHeaderScript = Handlebars.compile($('#todosHeader').html());
    completedHeaderScript = Handlebars.compile($('#completed-header-temp').html());
    headerScript = Handlebars.compile($('#main-header-temp').html());
    Handlebars.registerPartial('allItems', allListScript);
    Handlebars.registerPartial('todosHeader', todosHeaderScript);
  },
  bindEvents: function() {
    $addNewToDo.on('click', manager.processNewToDo.bind(manager));
    $submitToDoBtn.on('click', manager.renderToDo.bind(manager));
    $toDoList.on('click', '.last', manager.deleteToDo.bind(manager));
    $toDoList.on('click', 'label', manager.editToDo.bind(manager));
    $toDoList.on('click', '.list-item', Manager.prototype.toggleComplete.bind(manager));
    $completeBtn.on('click', Manager.prototype.markComplete.bind(manager));
    $('#left').on('click', 'dl', Manager.prototype.processListSelection.bind(manager));
    $(window).on('unload', Manager.prototype.storeData.bind(manager));
  },
  restoreData: function() {
    var collection = JSON.parse(localStorage.getItem('collection')),
        lastId = localStorage.getItem('lastId'),
        completed = JSON.parse(localStorage.getItem('completed')),
        toDosByDate = JSON.parse(localStorage.getItem('toDosByDate')),
        completedToDosByDate = JSON.parse(localStorage.getItem('completedToDosByDate'));

    if (lastId) {
      manager.toDos.lastId = lastId;
      manager.toDos.collection = collection;
      manager.toDos.completed = completed;
      manager.toDos.toDosByDate = toDosByDate;
      manager.toDos.completedToDosByDate = completedToDosByDate;
    }

    UI.displayToDos(manager.toDos.collection);
    UI.displayToDosByDate(manager.toDos.toDosByDate);
    UI.displayCompletedToDosByDate(manager.toDos.completedToDosByDate);
    UI.displayHeaderData({title: 'All Todos',
                          total: manager.toDos.collection.length});

    manager.setSelectedList(manager.curSelectedList, manager.curTitle);
    
  },
}


$(function() {
  manager = new Manager();
  SETUP.init();
});
