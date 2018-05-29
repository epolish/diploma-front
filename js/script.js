var Statement = function (data) {
    this.value = null;
    this.childStatements = null;
    this.relationshipValue = null;
    this.relationshipSupportLevel = null;

    if (data !== undefined) {
        if (data.value !== undefined) {
            this.value = data.value;
        }

        if (data.childStatements !== undefined) {
            this.childStatements = data.childStatements;
        }

        if (data.relationshipValue !== undefined) {
            this.relationshipValue = data.relationshipValue;
        }

        if (data.relationshipSupportLevel !== undefined) {
            this.relationshipSupportLevel = data.relationshipSupportLevel;
        }
    }
};

var StatementViewModel = function (settings) {
    var self = this;

    self.storage = settings.storage;
    self.isLoading = ko.observable(false);
    self.apiBaseUrl = settings.apiBaseUrl;
    self.errorMessage = ko.observable(null);
    self.statementHistory = ko.observableArray([]);
    self.storageHistoryKey = settings.storageHistoryKey;
    self.statement = ko.mapping.fromJS(new Statement());
    self.rootStatementValue = settings.rootStatementValue;
    self.descriptionCombineAlias = settings.descriptionCombineAlias;

    self.initialize = function (refreshStorage) {
        self.errorMessage(null);
        self.statementHistory([]);

        if (!refreshStorage && !self.storage.isEmpty(self.storageHistoryKey)) {
            self.initializeFromStorage();

            return true;
        }

        self.storage.set(self.storageHistoryKey, []);
        self.loadStatement(self.rootStatementValue);
    };
    self.initializeFromStorage = function () {
        var storageHistory = $(self.storage.get(self.storageHistoryKey)),
            lastStatement = storageHistory.last().get(0);

        ko.mapping.fromJS(new Statement({
            value: lastStatement.value,
            relationshipValue: lastStatement.relationshipValue,
            relationshipSupportLevel: lastStatement.relationshipSupportLevel,
            childStatements: $(lastStatement.childStatements).map(
                function (index, statement) {
                    return new Statement({
                        value: statement.value,
                        relationshipValue: statement.relationshipValue,
                        relationshipSupportLevel: statement.relationshipSupportLevel
                    });
                }
            ).get()
        }), self.statement);

        storageHistory.each(function (index, statement) {
            self.statementHistory.push(new Statement({
                value: statement.value,
                relationshipValue: statement.relationshipValue,
                relationshipSupportLevel: statement.relationshipSupportLevel
            }));
        });
    };
    self.isCurrentStatementHasChild = function () {
        if (!Array.isArray(self.statement.childStatements())) {
            return false;
        }

        return self.statement.childStatements().length > 0;
    };
    self.getStatementDescription = function (statement) {
        var description = '';

        if (statement.relationshipValue) {
            description += statement.relationshipValue;
            description += self.descriptionCombineAlias;
        }

        if (statement.value) {
            description += statement.value
        }

        return description;
    };
    self.addCurrentStatementToHistory = function () {
        self.statementHistory.push(new Statement({
            value: self.statement.value(),
            relationshipValue: self.statement.relationshipValue(),
            relationshipSupportLevel: self.statement.relationshipSupportLevel()
        }));
    };
    self.addCurrentStatementToStorageHistory = function () {
        var currentValue = self.storage.get(self.storageHistoryKey);

        currentValue.push(new Statement({
            value: self.statement.value(),
            relationshipValue: self.statement.relationshipValue(),
            relationshipSupportLevel: self.statement.relationshipSupportLevel(),
            childStatements: $(self.statement.childStatements()).map(
                function (index, statement) {
                    return new Statement({
                        value: statement.value(),
                        relationshipValue: statement.relationshipValue(),
                        relationshipSupportLevel: statement.relationshipSupportLevel()
                    });
                }
            ).get()
        }));

        self.storage.set(self.storageHistoryKey, currentValue);
    };
    self.validateResponse = function (response) {
        if (response.error !== undefined) {
            self.errorMessage(response.error);

            return false;
        }

        return true;
    };
    self.loadStatement = function (value) {
        if (self.isLoading()) {
            return false;
        }

        self.isLoading(true);
        self.errorMessage(null);

        $.getJSON(self.apiBaseUrl + value, function (response) {
            if (!self.validateResponse(response)) {
                ko.mapping.fromJS(new Statement(), self.statement);

                return false;
            }

            ko.mapping.fromJS({
                value: response.statement_value,
                relationshipValue: response.parent_relationship_value,
                relationshipSupportLevel: response.parent_relationship_support_level_value,
                childStatements: $(response.child_statements).map(
                    function (index, statement) {
                        return new Statement({
                            value: statement.statement_value,
                            relationshipValue: statement.relationship_value,
                            relationshipSupportLevel: statement.relationship_support_level_value
                        });
                    }
                ).get()
            }, self.statement);

            self.addCurrentStatementToHistory();
            self.addCurrentStatementToStorageHistory();
        }).fail(function(jqxhr, textStatus, error) {
            self.errorMessage('System Exception: ' + error);
        }).always(function () {
            self.isLoading(false);
        });
    };

    self.initialize();
};

ko.bindingHandlers.hidden = (function() {
    function setVisibility(element, valueAccessor) {
        var hidden = ko.unwrap(valueAccessor());

        $(element).css('visibility', hidden ? 'hidden' : 'visible');
    }

    return { init: setVisibility, update: setVisibility };
})();

ko.applyBindings(new StatementViewModel({
    storage: $.localStorage,
    rootStatementValue: 'root',
    apiBaseUrl: '/statement.php?value=',
    descriptionCombineAlias: ', значит ',
    storageHistoryKey: 'statement_history'
}));