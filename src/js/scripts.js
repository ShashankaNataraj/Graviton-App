/*
########################################
              MIT License

Copyright (c) 2019 Marc Espín Sanz

License > https://github.com/Graviton-Code-Editor/Graviton-App/blob/master/LICENSE.md

#########################################
*/
const g_version = {
  date:"300420",
  version:"0.7.4",
  state:"Alpha"
}
const os = require('os');
const close_icon = `<svg xmlns="http://www.w3.org/2000/svg" width="11.821" height="11.82" viewBox="0 0 11.821 11.82">
  <g id="close" transform="translate(-4.786 -4.868)">
    <path id="Trazado_1" data-name="Trazado 1" d="M.7,1.5l12.336-.081a.467.467,0,0,1,.472.472.482.482,0,0,1-.478.478L.69,2.452a.467.467,0,0,1-.472-.472A.482.482,0,0,1,.7,1.5Z" transform="translate(16.917 7.296) rotate(135)" stroke-linecap="square" stroke-width="1.2"/>
    <path id="Trazado_2" data-name="Trazado 2" d="M.428-.043,12.764.038a.482.482,0,0,1,.478.478.467.467,0,0,1-.472.472L.434.906A.482.482,0,0,1-.043.428.467.467,0,0,1,.428-.043Z" transform="translate(15.029 15.778) rotate(-135)" stroke-linecap="square" stroke-width="1.2"/>
  </g>
</svg>`;
const { shell } = require("electron");
const fs = require("fs-extra");
const path = require("path");
const { dialog } = require("electron").remote;
const mkdirp = require("mkdirp");
const remote = require("electron").remote;
const BrowserWindow = require("electron").BrowserWindow;
const app  = require('electron').remote
const getAppDataPath = require("appdata-path");
const $ = require('jquery');
const {webFrame} = require('electron');
let dir_path;
let i;
let DataFolderDir = path.join(path.join(__dirname, ".."), ".graviton");
let tabs = [];
let tabsEqualToFiles = [];
let FirstFolder = "not_selected";
let editingTab;
let ids = 0;
let plang = " ";
let _notifications = [];
let filepath ;
let editors = [];
let editor;
let editorID;
let editor_mode = "normal";
let g_highlighting = "activated";
let _previewer;
let _enable_preview = false;
let log = [];
let themes =[];
let themeObject;
const dictionary = autocomplete.javascript; //Import javascript dictionary
if (path.basename(__dirname) !== "Graviton-Editor") DataFolderDir = path.join(getAppDataPath(),".graviton");
if (!fs.existsSync(DataFolderDir)) fs.mkdirSync(DataFolderDir); //Create .graviton if it doesn't exist
/* Set path for graviton's files and dirs */
let logDir = path.join(DataFolderDir, "log.json"); 
let configDir = path.join(DataFolderDir, "config.json");
let timeSpentDir = path.join(DataFolderDir, "_time_spent.json");
let themes_folder = path.join(DataFolderDir, "themes");
let highlights_folder = path.join(DataFolderDir, "highlights");
let plugins_folder = path.join(DataFolderDir, "plugins");
let plugins_db = path.join(DataFolderDir, "plugins_db");
function loadEditor(dir, data,type) {
    if (document.getElementById(dir + "_editor") == undefined) {
        //Editor doesn't exist
        switch(type){
          case "text":
            let text_container = document.createElement("div");
            text_container.classList = "code-space";
            text_container.setAttribute("id", dir + "_editor");
            document.getElementById("g_editors").appendChild(text_container);
            let codemirror = CodeMirror(document.getElementById(dir + "_editor"), {
              value: data,
              mode: "text/plain",
              htmlMode: false,
              theme: "default",
              lineNumbers: true,
              autoCloseTags: true
            });
            document.getElementById("g_status_bar").children[0].innerText = getFormat(path.basename(dir));
            let new_editor_text = {
              id: dir + "_editor",
              editor: codemirror,
              path:dir
            };
            editors.push(new_editor_text);
            if (document.getElementById(editorID) != undefined)document.getElementById(editorID).style.display = "none";
            editorID = new_editor_text.id;
            editor = new_editor_text.editor;
            document.getElementById(dir + "_editor").style.display = "block";
            editor.setOption("theme", themeObject["Highlight"]); //Update highlither after applying a new theme
          break;
          case"image":
              const image_container = document.createElement("div");
              image_container.classList = "code-space";
              image_container.setAttribute("id", dir + "_editor");
              const img = document.createElement("img");
              img.setAttribute("src",dir);
              image_container.appendChild(img);
              document.getElementById("g_editors").appendChild(image_container);
              const new_editor_image = {
                  id: dir + "_editor",
                  editor: undefined,
                  path:dir
              };
              editors.push(new_editor_image);
              if (document.getElementById(editorID) != undefined)document.getElementById(editorID).style.display = "none";
              document.getElementById(dir + "_editor").style.display = "block";
              editorID = new_editor_image.id;
              document.getElementById("g_status_bar").children[0].innerText = path.basename(dir).split(".").pop();
          break;
        }
      }else{ //Editor exists
        for (i = 0; i < editors.length; i++) {
          if(document.getElementById(editors[i].id)!=null ){
            document.getElementById(editors[i].id).style = "display:none;";
          }
          if (editors[i].id == dir + "_editor") {
            if(editors[i].editor!=undefined){
              editor = editors[i].editor;
              editor.refresh();
              document.getElementById("g_status_bar").children[0].innerText = getFormat(path.basename(editors[i].path));
            }else{
              document.getElementById("g_status_bar").children[0].innerText = path.basename(dir).split(".").pop();
            }
            editorID = editors[i].id;
            document.getElementById(editorID).style = "display:block;";
          }
        }
    }
    function filterIt(arr, searchKey, cb) {
      var list = [];
      for (var i=0;i < arr.length; i++) {
        var curr = arr[i];
        Object.keys(curr).some(function(key){
          if (typeof curr[key] === "string" && curr[key].includes(searchKey)) {
            list.push(curr);
          }
        });
      }
      return cb(list);
    }
    if(editor!=undefined){
    editor.on("change", function() {
      const close_icon =document.getElementById(editingTab);
      close_icon.setAttribute("file_status", "unsaved");
      close_icon.children[1].setAttribute("onclick", "save_file_warn(this)");
      close_icon.children[1].innerHTML = ` <svg class="ellipse" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">
  <circle id="Elipse_1" data-name="Elipse 1" cx="5" cy="5" r="5"/>
</svg> `;
          document
            .getElementById(editingTab)
            .setAttribute("data", editor.getValue());
      if(current_config["autoCompletionPreferences"]=="activated" && plang=="JavaScript"){
          //Getting Cursor Position
          const cursorPos = editor.cursorCoords();
          //Getting Last Word
          const A1 = editor.getCursor().line;
          const A2 = editor.getCursor().ch;
          const B1 = editor.findWordAt({line: A1, ch: A2}).anchor.ch;
          const B2 = editor.findWordAt({line: A1, ch: A2}).head.ch;
          const lastWord = editor.getRange({line: A1,ch: B1}, {line: A1,ch: B2});
          //Context Menu
        filterIt(dictionary, lastWord, function(filterResult){
            if (filterResult.length > 0 && lastWord.length >= 3) {
              let contextOptions;
              for (var i=0; i< filterResult.length; i++) {
                contextOptions +="<button class='option'>"+filterResult[i]._name+"</button>"
                contextOptions = contextOptions.replace("undefined","");
                $("context .menuWrapper").html(contextOptions);
              }
              $("context").fadeIn();
              $("context").css({"top":(cursorPos.top + 30)+"px", "left":cursorPos.left+"px"});
              $("context .menuWrapper .option").first().addClass("hover");
            }else if (filterResult.length === 0 || lastWord.length < 3){
              $("context").fadeOut();
              $("context .menuWrapper").html("");
            }
          });
        }
      });
    editor.on("keydown", function(editor, e){
      if ($("context").css("display") != "none") {
        //Ignore keys actions on context options displayed.
        editor.setOption("extraKeys", {
          "Up": function(){
            if(true) {
              return CodeMirror.PASS;
            }
          },
          "Down": function(){
            if(true) {
              return CodeMirror.PASS;
            }
          },
          "Enter": function(){
            if(true) {
              return CodeMirror.PASS;
            }
          }
        });
      }else{//Reset keys actions.
        editor.setOption("extraKeys", {
          "Up": "goLineUp"
        });
      }
      //Context Options keys handler
      $("context .menuWrapper .option.hover").filter(function(){
        if (e.keyCode === 40 && !$("context .menuWrapper .option").last().hasClass("hover") && $("context").css("display") != "none") {
          $("context .menuWrapper .option").removeClass("hover")
          $(this).next().addClass("hover");
          document.getElementById("context").scrollBy(0, 30);
          return false;
        } else if (e.keyCode === 38 && !$("context .menuWrapper .option").first().hasClass("hover") && $("context").css("display") != "none") {
          $("context .menuWrapper .option").removeClass("hover")
          $(this).prev().addClass("hover");
          document.getElementById("context").scrollBy(0, -30);
          return false;
        }
        //Selection key Triggers
        if (e.keyCode === 13) {
          const A1 = editor.getCursor().line;
          const A2 = editor.getCursor().ch;
          const B1 = editor.findWordAt({line: A1, ch: A2}).anchor.ch;
          const B2 = editor.findWordAt({line: A1, ch: A2}).head.ch;
          const selected = $(this).text();
          editor.replaceRange(selected, {line: A1,ch: B1}, {line: A1,ch: B2});
          setTimeout(function() {
            $("context").fadeOut();
            $("context .menuWrapper").html("");
          },100)
        }
      });
    });
    $("context .menuWrapper").on("mouseenter", "div.option", function(){
      $("context .menuWrapper .option").not(this).removeClass("hover");
      $(this).addClass("hover");
    });

    $("context .menuWrapper").on("mousedown", "div.option", function(e) {
      const A1 = editor.getCursor().line;
      const A2 = editor.getCursor().ch;
      const B1 = editor.findWordAt({line: A1, ch: A2}).anchor.ch;
      const B2 = editor.findWordAt({line: A1, ch: A2}).head.ch;
      const selected = $(this).text();
      editor.replaceRange(selected, {line: A1,ch: B1}, {line: A1,ch: B2});
      $("context").fadeOut();
      $("context .menuWrapper").html("");
      e.preventDefault();
    })
    editor.setOption("extraKeys", { /*TEST*/
      Ctrl: function(editor) {  
      },
    });
    editor.on("change", function() {    //Preview detector
          setTimeout(function() {
            if (graviton.getCurrentFile() != undefined && _enable_preview === true) {
              saveFile();
              _previewer.reload();
            }
          }, 550);
      });
  }
}
//loadEditor("start", "/*This is Graviton Code Editor!*/"); //Create the first editor
function restartApp() {
    remote.app.relaunch();
    remote.app.exit(0);
}
Mousetrap.bind("ctrl+s", function() {
  saveFile();
});
function save_file_warn(ele){
  new g_dialog({
    id:"saving_file_warn",
    title:current_config.language['Warn'],
    content:current_config.language["FileExit-dialog-message"],
    buttons:{
      [current_config.language['FileExit-dialog-button-accept']]:`closeDialog(this); ${ele.getAttribute('onclose')}`,
      [current_config.language['Cancel']]:`closeDialog(this);`,
      [current_config.language['FileExit-dialog-button-deny']]:'saveFile(); closeDialog(this);',
    }
  })
}
function saveFileAs() {
  dialog.showSaveDialog(fileName => {
    fs.writeFile(fileName, editor.getValue(), err => {
      if (err) {
        alert(`An error ocurred creating the file ${err.message}`);
        return;
      }
      filepath = fileName;
      new Notification("Graviton",`The file has been succesfully saved in ${fileName}`);
    });
  });
}
function openFile() {
  dialog.showOpenDialog(fileNames => {
    // fileNames is an array that contains all the selected files
    if (fileNames === undefined) {
      return;
    }
    fs.readFile(fileNames[0], "utf8", function(err, data) {
      if (err) {
        return err;
      }
      editor.setValue(data); //Updating data in the editor
    });
  });
}
function openFolder() {
  dialog.showOpenDialog({properties: ["openDirectory"]},
    selectedFiles =>{
      if (selectedFiles === undefined)return;
      loadDirs(selectedFiles[0], "g_directories", true)
    }
  );
}
function saveFile() {
  fs.writeFile(filepath, editor.getValue(), err => {
    if (err)  return err;
    document.getElementById(editingTab).setAttribute("file_status", "saved");
    document
      .getElementById(editingTab)
      .children[1].setAttribute("onclick", document.getElementById(editingTab).children[1].getAttribute("onclose"));
    document.getElementById(editingTab).children[1].innerHTML = close_icon;
  });
}
function loadDirs(dir, appendID, __FirstTime) {
  if(appendID=="g_directories") dir_path = dir;
  let _SUBFOLDER;
  FirstFolder = dir;
  const me = document.getElementById(appendID);
  if (me.getAttribute("opened") == "true") {
    me.setAttribute("opened", "false");
    const dir_length = me.children.length;
    me.children[0].children[0].setAttribute("src", g_getCustomFolder(path.basename(FirstFolder),"close"));
    me.children[1].innerHTML = "";
    return;
  } else {
    document.getElementById(appendID).setAttribute("opened", "true");
    if (__FirstTime === false) {
      const click = document.getElementById(appendID).children[0];
      click.children[0].setAttribute("src", g_getCustomFolder(path.basename(FirstFolder),"open"));
    }
  }
  if (__FirstTime) {
    if(document.getElementById("openFolder")!=null) document.getElementById("openFolder").remove();
    registerNewProject(dir); 
    _SUBFOLDER = document.createElement("div");
    for (i = 0; i < document.getElementById(appendID).children.length; i++) {
      document.getElementById(appendID).children[i].remove();
    }
    document.getElementById(appendID).setAttribute("opened", "false");
    _SUBFOLDER.setAttribute("class", "folder");
    _SUBFOLDER.setAttribute("myPadding", "50");
    _SUBFOLDER.setAttribute("style", "margin:10px 20px; font-size:17px; ");
    _SUBFOLDER.innerText = path.basename(dir);
    document.getElementById(appendID).appendChild(_SUBFOLDER);
  }else{
     _SUBFOLDER = document.getElementById(appendID).children[1];
  }
  const paddingListDir = Number(document.getElementById(appendID).getAttribute("myPadding")) + 7; //Add padding
  fs.readdir(dir, (err, paths) => {
    ids = 0;
    if(paths==undefined) {
      graviton.throwError("Cannot read files on the directory :" + FirstFolder + ". Check the permissions.")
      return;
    }
    for (i = 0; i < paths.length; i++) {
      let _LONGPATH = path.join(dir, paths[i]);
      if (graviton.currentOS() == "win32") {
        _LONGPATH = _LONGPATH.replace(/\\/g, "\\\\");
      }
      ids++;
      const stats = fs.statSync(_LONGPATH);
      if (stats.isDirectory()) {
        //If is folder
        const element = document.createElement("div");
        element.setAttribute("opened", "false");
        element.setAttribute("ID", ids+dir);
        element.setAttribute("name", paths[i]);
        element.setAttribute(
          "style",
          `padding-left:${paddingListDir}px; vertical-align: middle;`
        );
        const list = document.createElement("div");
        element.setAttribute("myPadding", paddingListDir);
        element.setAttribute("longPath", _LONGPATH);
        const touch = document.createElement("div");
        touch.setAttribute(
          "onClick",
          `loadDirs('${_LONGPATH}','${ids+dir.replace(/\\/g, "\\\\")}',false)`
        );
        touch.innerText = paths[i];
        touch.setAttribute("class", " folder_list2 ");
        touch.setAttribute(
          "style",
          ` width:${Number(paths[i].length * 6 + 55)}px;`
        );
        const image = document.createElement("img");
        image.setAttribute("src", g_getCustomFolder(paths[i],"close"));
        
        image.setAttribute("style", "float:left; margin-right:3px;");
        element.appendChild(touch);
        touch.appendChild(image);
        element.appendChild(list);
        _SUBFOLDER.appendChild(element);
      }
    }
    for (i = 0; i < paths.length; i++) {
      let _LONGPATH = path.join(dir, paths[i]);
      if (graviton.currentOS() == "win32") {
        _LONGPATH = _LONGPATH.replace(/\\/g, "\\\\"); //Delete
      }
      ids++;
      const stats = fs.statSync(_LONGPATH);
      if (stats.isFile()) {
        //If it's file
        const element = document.createElement("div");
        element.setAttribute("class", "folder_list1");
        element.setAttribute("ID", ids+dir.replace(/\\/g, "\\\\") + "B");
        element.setAttribute("name", paths[i]);
        element.setAttribute(
          "style",
          `margin-left:${paddingListDir }px; 
          vertical-align: middle; width:${paths[i].length * 6 + 55}px;`); //BUGG
        element.setAttribute("myPadding", paddingListDir);
        element.setAttribute("longPath", _LONGPATH);
        element.setAttribute("onClick", "g_createTab(this)");
        _SUBFOLDER.appendChild(element);
        const image = document.createElement("img");
        image.setAttribute("src", `src/icons/files/${getFormat(paths[i])}.svg`);
        image.setAttribute("style", "float:left; margin-right:3px;");
        const p = document.createElement("p");
        p.innerText = paths[i];
        element.appendChild(image);
        element.appendChild(p);
      }
    }
  });
}
function g_getCustomFolder(path,state){
    switch(path){
        case"node_modules":
            return "src/icons/custom_icons/node_modules.svg"
        break;
        case".git":
            return "src/icons/custom_icons/git.svg"
        break;
        default:
            if(state=="close"){
                return "src/icons/closed.svg";
            }else{
                return "src/icons/open.svg";
            }
    }
}
function getFormat(text) {
  switch (text.split(".").pop()) {
    case "html":
      return "html";
      break;
    case "js":
      return "js";
      break;
    case "css":
      return "css";
      break;
    case "json":
      return "json";
      break;
    case "go":
      return "go";
      break;
    case "sql":
      return  "sql";
      break;
    case "ruby":
      return "ruby";
      break;
    case "php":
      return "php";
      break;
    case "sass":
      return "sass";
      break;
    case "dart":
      return "dart";
      break;
    case "pascal":
      return "pascal";
      break;
    case "md":
      return "md";
      break;
    default:
      return "unknown";
  }
}
function g_createTab(object) {
  for(i=0;i<tabsEqualToFiles.length+1;i++){ 
      if (i!=tabsEqualToFiles.length && tabsEqualToFiles[i].id === object.id) {
          return;
      }else if(i==tabsEqualToFiles.length) { //Tab is created because it doesn't exist
          document.getElementById("temp_dir_message").style="visibility:hidden;"
          const tab = document.createElement("div");
          tab.setAttribute("ID", object.id + "A");
          tab.setAttribute("longPath", object.getAttribute("longpath"));
          tab.setAttribute("class", "tabs");
          tab.style =
          `min-width: ${(object.getAttribute("name").length * 4 + 115)}px; 
          max-width: ${(object.getAttribute("name").length * 5 + 100)}px`;
          tab.setAttribute("onclick", "g_loadTab(this)");
          tab.setAttribute("file_status", "saved");
          const tab_text = document.createElement("p");
          tab_text.style = "float:left; text-align:center;";
          tab_text.innerText = object.getAttribute("name");
          const tab_x = document.createElement("button");
          tab_x.setAttribute("onclose", "g_closeTab('" + object.id + "A');");
          tab_x.setAttribute("onclick", "g_closeTab('" + object.id + "A')");
          tab_x.setAttribute("class", "close_tab");
          tab_x.setAttribute("hovering", "false");
          tab_x.innerHTML = close_icon;
          tab_x.addEventListener("mouseover", function (e) {
              this.setAttribute("hovering",true);
          });
          tab_x.addEventListener("mouseout", function (e) {
              this.setAttribute("hovering",false);
          });
          tab.appendChild(tab_text);
          tab.appendChild(tab_x);
          document.getElementById("g_tabs_bar").appendChild(tab);
          tabs.push(tab);
          tabsEqualToFiles.push(object);
          const g_newPath = object.getAttribute("longPath");
          filepath = g_newPath;
          switch(filepath.split(".").pop()){
            case"svg":
            case"png":
            case"ico":
            case "jpg":
              loadEditor(filepath, null,"image");
              editingTab = tab.id;
              selected = object;
              for(i=0;i<tabs.length;i++){
                if (tabs[i].classList.contains("selected")) tabs[i].classList.remove("selected");
              }
              tab.classList.add("selected");
              break;
            default:
              fs.readFile(g_newPath, "utf8", function(err, data) {
                if (err) return console.log(err);
                tab.setAttribute("data", data);
                loadEditor(g_newPath, data,"text");
                if(g_highlighting=="activated") updateCodeMode(g_newPath);
                document.getElementById(editorID).style.height = " calc(100% - (55px))"; 
                editingTab = tab.id;
                selected = object;
                for(i=0;i<tabs.length;i++){
                  if (tabs[i].classList.contains("selected")) tabs[i].classList.remove("selected");
                }
                tab.classList.add("selected");
                editor.refresh();
              });
          }
          return;
      }
  }
}
function g_closeTab(ele) {
  const g_object = document.getElementById(ele.replace(/\\/g, "\\\\"));
  for(i=0;i<tabs.length;i++){
    const tab = tabs[i];
    let NEW_SELECTED_TAB;
    if (tab.id == ele.replace(/\\/g, "\\\\")) {
      tabsEqualToFiles.splice(i, 1);
      tabs.splice(i, 1);
      document
        .getElementById(g_object.getAttribute("longPath") + "_editor")
        .remove();
      editors.splice(i + 1, 1);
      g_object.remove();
    if (tabs.length === 0) { //Any tab opened
        document.getElementById("g_editors").style = " ";
        filepath = " ";
        plang = "";
        document.getElementById("g_status_bar").children[0].innerText = plang;
        document.getElementById("temp_dir_message").style="visibility:visible;"
    } else if (i === tabs.length) { //Last tab selected
        NEW_SELECTED_TAB = tabs[Number(tabs.length) - 1];
    } else{
        NEW_SELECTED_TAB = tabs[i]; //All tabs except the last one
    }
    if (NEW_SELECTED_TAB != undefined ) {
        for(i=0;i<tabs.length;i++){
          if (tabs[i].classList.contains("selected")) {
            tabs[i].classList.remove("selected"); 
          }
        }
        editingTab = NEW_SELECTED_TAB.id;
        NEW_SELECTED_TAB.classList.add("selected");
        const g_newPath = NEW_SELECTED_TAB.getAttribute("longpath");
        filepath = g_newPath;
        loadEditor(g_newPath, g_object.getAttribute("data"),"text");
        if(g_highlighting=="activated") updateCodeMode(g_newPath);
      }
    }
  }
}
function g_loadTab(object) {
  if (object.id != editingTab && object.children[1].getAttribute("hovering") == "false") {
    for(i=0;i<tabs.length;i++){
      if (tabs[i].classList.contains("selected")) {
        tabs[i].classList.remove("selected"); 
      }
    }
    object.classList.add("selected");
    const g_newPath = object.getAttribute("longPath");
    filepath = g_newPath
    loadEditor(g_newPath, object.getAttribute("data"));
    if(g_highlighting=="activated") updateCodeMode(g_newPath);
    editingTab = object.id;
  }
}
function updateCodeMode(path) {
  if(g_highlighting=="activated"){
    switch (path.split(".").pop()) {
      case "html":
        editor.setOption("mode", "htmlmixed");
        editor.setOption("htmlMode", true);
        plang = "HTML";
        break;
      case "css":
        editor.setOption("htmlMode", false);
        editor.setOption("mode", "css");
        plang = "CSS";
        break;
      case "js":
        editor.setOption("htmlMode", false);
        editor.setOption("mode", "javascript");
        plang = "JavaScript";
        break;
      case "json":
        editor.setOption("htmlMode", false);
        editor.setOption("mode", "javascript");
        plang = "JSON / JavaScript";
        break;
      case "go":
        editor.setOption("htmlMode", false);
        editor.setOption("mode", "go");
        plang = "Go";
        break;
      case "sql":
        editor.setOption("htmlMode", false);
        editor.setOption("mode", "sql");
        plang = "SQL";
        break;
      case "ruby":
        editor.setOption("htmlMode", false);
        editor.setOption("mode", "ruby");
        plang = "Ruby";
        break;
      case "php":
        editor.setOption("htmlMode", false);
        editor.setOption("mode", "php");
        plang = "PHP";
        break;
      case "sass":
        editor.setOption("htmlMode", false);
        editor.setOption("mode", "sass");
        plang = "Sass";
        break;
      case "dart":
        editor.setOption("htmlMode", false);
        editor.setOption("mode", "dart");
        plang = "Dart";
        break;
      case "pascal":
        editor.setOption("htmlMode", false);
        editor.setOption("mode", "pascal");
        plang = "Pascal";
        break;
      case "md":
        editor.setOption("htmlMode", false);
        editor.setOption("mode", "markdown");
        plang = "Markdown";
        break;
      default:
    }
  }
}
const registerNewProject = function(dir) { //Add a new directory to the history if it is the first time it has been opened in the editor
  fs.readFile(logDir, "utf8", function(err, data) {
    if(err) return;
    log = JSON.parse(data);
    for (i = 0; i < log.length+1; i++) {
      if (i!=log.length ){
        if(log[i].Path == dir) {
          return;
        }
      }else if(i ==log.length){
        log.unshift({
          Name: path.basename(dir),
          Path: dir
        });
        fs.writeFile(logDir, JSON.stringify(log));
        return;
      }
    }
  });
}
const g_ZenMode = function() {
  if (editor_mode == "zen") {
    editor_mode = "normal";
    document.getElementById("g_explorer").style ="visibility: visible; width:200px; overflow:auto;";
    document.getElementById("g_editors").style = "margin:0px 0px 0px 200px";
    document.getElementById("g_status_bar").style = "margin:0px 0px 0px 200px";
  }else{
    editor_mode = "zen";
    document.getElementById("g_explorer").style = "visibility: hidden; width:0px; overflow:hidden;";
    document.getElementById("g_editors").style = "margin:0px";
    document.getElementById("g_status_bar").style = "margin:0px";
  }
}
const g_preview = function() {
  const url = require("url");
  const BrowserWindow = remote.BrowserWindow;
  if (_enable_preview === false){
    if(getFormat(graviton.getCurrentFile().path)!="html") return;
    _enable_preview = true;                                                                   
    _previewer = new BrowserWindow({                                                          
      width: 800,                                                                             
      height: 600                                                                        
    });                                                                             
    _previewer.loadURL(                                     
      url.format({                                                                  
        pathname: graviton.getCurrentFile().path,                                       
        protocol: "file:",                                                       
        slashes: true                                                         
      })                                                                      
    );                                                                            
    _previewer.on("closed", () => {
      _enable_preview = false;
    });
    _previewer.setTitle("Previewer");
  } else {
    _enable_preview = false;
    _previewer.close();
  }
}
const HTML_template =`
<!DOCTYPE html>

<html lang="en">
  <head>

    <meta charset="utf-8">

    <title>New Project</title>

    <meta name="description" content="Graviton Project">

  </head>
  <body>

    <h1>Hello World!</h1>

  </body>
</html>
`;
const g_newProject = function(template){
  dialog.showOpenDialog({properties: ["openDirectory"]},
    selectedFiles =>{
      if (selectedFiles === undefined) {
            
      }else{
        switch(template){
          case"html":
            const g_project_dir = path.join(selectedFiles[0], ".GravitonProject "+Date.now());
            fs.mkdirSync(g_project_dir);
            fs.writeFile(path.join(g_project_dir,"index.html"),HTML_template, err => {
              if (err) {
                return err;
              }
              loadDirs(g_project_dir, "g_directories", true)
            });
          break;
        }
      }
    }
  );
}
function g_openNewProjects(){
  const g_all_window = document.createElement("div");
  g_all_window.setAttribute("id","templates_window");
  g_all_window.setAttribute("style","-webkit-user-select: none;");
  const g_background = document.createElement("div");
  g_background.setAttribute("class","opened_window");
  g_background.setAttribute("onclick","g_hideNewProjects()"); 
  const g_body = document.createElement("div");
  g_body.setAttribute("class","body_window");
  g_body.setAttribute("id","body_window");
  g_all_window.appendChild(g_background);
  g_all_window.appendChild(g_body);
  document.body.appendChild(g_all_window);
}
function g_NPgoPage(num){
  switch (num){
    case "1":
      document.getElementById("body_window").innerHTML=`
        <h2 class="window_title">${current_config.language["Templates"]}</h2> 
        <div onclick="g_newProject('html'); g_hideNewProjects();" class="section_hover">
            <p>HTML</p>
        </div>
      `;
    break;
  }
}
function g_hideNewProjects(){
  document.getElementById("templates_window").remove();
}
const preload = (array)=>{ //Preload images when booting
  for(i=0;i<array.length;i++){
    document.body.innerHTML+=`
    <img id="${array[i]}"src="${array[i]}"></img>`
    document.getElementById(array[i]).remove();
  }
}