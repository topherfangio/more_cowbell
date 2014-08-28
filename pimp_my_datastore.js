// ==========================================================================
// Project:   More Cowbell -- Shit you really want if you develop with SproutCore.
// Copyright: ©2011 Erich Atlas Ocean.
// License:   Licensed under an MIT license (see license.js).
// ==========================================================================
/*global EO */

(function () {
  if (!SC || !SC.Store || !SC.NestedStore) return ;

/**
 Desired result:

  {
    "sc_version": 2,
    "sc_types": ["Foo", "Bar"],
    // TODO: Should we include Namespace information as well?
    "Foo": {
      "created": [
        "<primaryKey>"
        // ... more created record ids of type "Foo"
      ],
      "updated": [
        "<primaryKey>"
        // ... more update record ids of type "Foo"
      ],
      "deleted": [
        "<primaryKey"
        // ...more deleted record ids of type "Foo"
      ],
      "attributes": {
        "<primaryKey>": {
          // attributes hash keys and values
        }
        // ... more attribute hashes for records of type "Foo"
      }
    },
    "Bar": {
      "created": [
        "<primaryKey>"
        // ... more created record ids of type "Bar"
      ],
      "updated": [
        "<primaryKey>"
        // ... more update record ids of type "Bar"
      ],
      "deleted": [
        "<primaryKey"
        // ...more deleted record ids of type "Bar"
      ],
      "attributes": {
        "<primaryKey>": {
          // attributes hash keys and values
        }
        // ... more attribute hashes for records of type "Bar"
      }
    }
  }
*/
SC.NestedStore.prototype.computeChangeset = function() {
  var nested    = this,
      store     = this.get('parentStore'),
      sc_types  = SC.Set.create(),
      changeset = {sc_version: 1},
      K         = SC.Record,
      dataHash, recordName, status, id, includeHash, recordType;

  if (!nested.get('hasChanges')) return changeset;

  nested.changelog.forEach(function(storeKey){
    recordType  = nested.recordTypeFor(storeKey);
    recordName  = recordType.toString().split(".")[1];
    status      = nested.peekStatus(storeKey);
    id          = nested.idFor(storeKey).toString();
    includeHash = NO;
    sc_types.add(recordName);

    if(!changeset[recordName]) {
      changeset[recordName] = {
        "created": [], "updated": [], "deleted": [], "attributes": {}
      };
    }

    if (status === K.READY_NEW) {
      changeset[recordName]['created'].push(id);
      includeHash = YES;
    } else if (status & K.DESTROYED) {
      changeset[recordName]['deleted'].push(id);
    } else if (status & K.DIRTY) {
      changeset[recordName]['updated'].push(id);
      includeHash = YES;
    }

    if (includeHash) {
      dataHash = nested.readDataHash(storeKey);
      delete dataHash[recordType.prototype.primaryKey];
      changeset[recordName]['attributes'][id] = dataHash;
    }

  });

  // fill in the changeset for 'store'
  changeset['sc_types'] = sc_types.toArray();
//  debugger;
  return changeset ;
};

SC.Store.prototype.applyChangeset = function(changeset, namespace) {

  var store = this,
  recordTypes = changeset['sc_types'],
  recordType, typeChanges, datahashes;

  /*
   * Make sure we fire changes only once
   */
  store.beginPropertyChanges();

  recordTypes.forEach(function(recordTypeName) {
    recordType = SC.objectForPropertyPath(namespace + '.' + recordTypeName);
    typeChanges = changeset[recordTypeName];
    if (!recordType) throw "Can't find object " + namespace + '.' + recordTypeName;
    datahashes = typeChanges['attributes'];

    // loop over created and updated items and insert into store
    typeChanges['created'].forEach(function(id) {
      var storeKey = store.storeKeyExists(recordType, id);

      if (storeKey) {
        var status = store.peekStatus(storeKey);

        if (status & SC.Record.BUSY) {
          store.dataSourceDidComplete(store.storeKeyFor(recordType, id), datahashes[id]);
          return;
        }
      }

      store.pushRetrieve(recordType, id, datahashes[id]);
    });

    // TODO: merge what is already here, incase we are only given a diff
    typeChanges['updated'].forEach(function(id) {
      var storeKey = store.storeKeyExists(recordType, id);

      if (storeKey) {
        var status = store.peekStatus(storeKey);

        if (status & SC.Record.BUSY) {
          store.dataSourceDidComplete(storeKey, datahashes[id]);
          return;
        }
      }

      store.pushRetrieve(recordType, id, datahashes[id]);
    });

    // Now Delete any records that have been deleted
    typeChanges['deleted'].forEach(function(id) {
      var storeKey = store.storeKeyExists(recordType, id);

      if (storeKey) {
        var status = store.peekStatus(storeKey);

        if (status === SC.Record.BUSY_LOADING) {
          store.dataSourceDidComplete(storeKey, datahashes[id]);
          return;
        }

        store.invokeLast(function() {
          store.pushDestroy(store.recordTypeFor(storeKey), id);
        });
      }
    });

  });

  /*
   * Make sure we fire changes only once
   */
  store.endPropertyChanges();

};

EO.CHANGESET_SCHEMA = {
  "type": "object",
  "properties": {
    "sc_version": { "type": "number", "required": true },
    "sc_types": {
      "type": "array",
      "required": true,
      "items": {
        "type": "string",
        "required": false
      },
      "uniqueItems" : true
    }
  },
  "additionalProperties" : {
    "type" : "object",
    "properties": {
      "created": {
        "type": "array",
        "required": true,
        "items": {
          "type": "string",
          "required": false
        },
        "uniqueItems" : true
      },
      "updated": {
        "type": "array",
        "required": true,
        "items": {
          "type": "string",
          "required": false
        },
        "uniqueItems" : true
      },
      "deleted": {
        "type": "array",
        "required": true,
        "items": {
          "type": "string",
          "required": false
        },
        "uniqueItems" : true
      },
      "attributes": {
        "type": "object",
        "additionalProperties": {
          "type": "object"
        }
      }
    }
  }
};
})();
