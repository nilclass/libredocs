//deal with legacy accounts:
(function() {
  var sessionObj = JSON.parse(localStorage.getItem('sessionObj'));
  if(!sessionObj.storageInfo) {
    sessionObj.storageInfo = {
      api: 'CouchDB',
      template: 'http://'+sessionObj.proxy+sessionObj.subdomain+'.iriscouch.com/{category}/',
      auth: 'http://'+sessionObj.subdomain+'.iriscouch.com/cors/auth/modal.html'
    };
    sessionObj.ownPadBackDoor = 'https://'+sessionObj.subdomain+'.iriscouch.com/documents';
    localStorage.setItem('sessionObj', JSON.stringify(sessionObj));
  }
})();

function checkLogin() {
  var sessionObj = JSON.parse(localStorage.getItem('sessionObj'));
  if(!sessionObj || sessionObj.state != 'ready')
  {
    window.location = '/'
    return;
  }
  document.getElementsByTagName('small')[0].innerHTML = (sessionObj.userAddress?' '+sessionObj.userAddress:'');
  document.getElementsByTagName('small')[0].innerHTML += '<a class="btn btn-danger" href="#" onclick="signOut();"><i class="icon-remove icon-white"></i> Sign out</a>';
}

function signOut()
{
  // once we have sync we can just clear this one.
  localStorage.removeItem("sessionObj");
  window.location = '/';
}

function currentUser()
{
  var sessionObj = JSON.parse(localStorage.getItem('sessionObj'));
  return sessionObj.userAddress;
}

function fetchDocuments(cb){
  getAndFetch('documents',cb);
}

function fetchDocument(id, cb){
  getAndFetch('pad:'+id,function(doc){
    doc.id = id;
    cb(doc);
  });
}

function saveDocuments(documents, cb){
  setAndPush('documents', documents, cb);
}

function fetchPadId(owner, link, cb){
  if(owner == currentUser())
  {
    getOrFetchPublic('pad:'+link, cb);
    return;
  }

  require(['http://unhosted.org/remoteStorage-0.4.2.js'], function(remoteStorage) {
    getOrFetchStorageInfo(owner, function(err, ownerStorageInfo) {
      var client = remoteStorage.createClient(ownerStorageInfo, 'public');
      client.get('padId:'+link, function(err2, data) {
        if(err2) {//the callback should use getPad which will deal with a null
          cb(null);
        } else {
          cb(data);
        }
      });
    });
  });
}

//TODO: push title aswell.
function pushPadId(link, padId, cb) {
  var links2Id = JSON.parse(localStorage.getItem('links2id') || '{}')
  links2Id[link] = padId;
  localStorage.setItem('links2id', JSON.stringify(links2Id));

  var sessionObj = JSON.parse(localStorage.getItem('sessionObj'));
  require(['http://unhosted.org/remoteStorage-0.4.2.js'], function(remoteStorage) {
    var client = remoteStorage.createClient(sessionObj.storageInfo, 'public', sessionObj.bearerToken);
    client.put('padId:'+link, padId, function(err, data) {
      console.log('pushed padId '+padId+' for docLink "'+link+'" - '+err+':"'+data+'"');
      cb();
    });
  });
}

function getOrFetchStorageInfo(user, cb) {
  var storageOwners = JSON.parse(localStorage.getItem('storageOwners') || '{}');
  if(storageOwners[user])
  {
    cb(storageOwners[user]);
    return;
  }
  require(['http://unhosted.org/remoteStorage-0.4.2.js'], function(remoteStorage) {
    remoteStorage.getStorageInfo(user, function(err, storageInfo){
      storageOwners[user] = storageInfo;
      localStorage.setItem('storageOwners', storageOwners);
      cb(storageInfo);
    });
  });
}

function getAndFetch(key, cb){
  var local = localStorage.getItem(key);
  if(local)
  {
    local = JSON.parse(local);
    cb(local);
  }
  if(isRecent(key)) return;
  if(!hasBeenUpdated(key)) return;
  fetchRemote(key, function(err, value){
    storeAndCallback(key, err, value, cb);
  });
}

function getOrFetchPublic(key, cb){
  var local = localStorage.getItem(key);
  if(local)
  {
    local = JSON.parse(local);
    cb(local);
    return;
  }
  fetchPublicRemote(key, function(err, value){
    storeAndCallback(key, err, value, cb);
  });
}

function storeAndCallback(key, err, value, cb){
  if(!err)
  {
    localStorage.setItem(key, JSON.stringify(value));
    timestamps = JSON.parse(localStorage.getItem('_timestamps')||'{}')
    timestamps[key] = new Date().getTime();
    localStorage.setItem('_timestamps', JSON.stringify(timestamps));
    cb(value);
  }
  else
  {
    if(err==404)
    {
      cb(null);
    }
  }
}

function isRecent(key, time){
  timestamps = JSON.parse(localStorage.getItem('_timestamps')||'{}')
  if(!timestamps[key]) return false;
  now = new Date().getTime();
  return now - timestamps[key] < (time || 60000);
}

function hasBeenUpdated(key, time){
  return true;
}

function setAndPush(key, value, cb){
  localStorage.setItem(key, JSON.stringify(value));
  timestamps = JSON.parse(localStorage.getItem('_timestamps')||'{}')
  timestamps[key] = new Date().getTime();
  localStorage.setItem('_timestamps', JSON.stringify(timestamps));
  pushRemote(key, value, cb);
}

function fetchRemote(key, cb){
  var sessionObj = JSON.parse(localStorage.getItem('sessionObj'));
  require(['http://unhosted.org/remoteStorage-0.4.2.js'], function(remoteStorage) {
    var client = remoteStorage.createClient(sessionObj.storageInfo, 'documents', sessionObj.bearerToken);
    client.get(key, function(err, data) {
      console.log('fetched '+key+' - '+err+':"'+data+'"');
      cb(err, data);
    });
  });
}

function fetchPublicRemote(key, cb){
  var sessionObj = JSON.parse(localStorage.getItem('sessionObj'));
  require(['http://unhosted.org/remoteStorage-0.4.2.js'], function(remoteStorage) {
    var client = remoteStorage.createClient(sessionObj.storageInfo, 'public');
    client.get(key, function(err, data) {
      console.log('fetched public '+key+' - '+err+':"'+data+'"');
      cb(err, data);
    });
  });
}

function pushRemote(key, value, cb){
  var sessionObj = JSON.parse(localStorage.getItem('sessionObj'));
  require(['http://unhosted.org/remoteStorage-0.4.2.js'], function(remoteStorage) {
    var client = remoteStorage.createClient(sessionObj.storageInfo, 'documents', sessionObj.bearerToken);
    client.put(key, value, function(err, data) {
      console.log('pushed '+key+' - '+err+':"'+data+'"');
      if(cb) cb();
    });
  });
}