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

    self.isLoading = ko.observable(false);
    self.apiBaseUrl = settings.apiBaseUrl;
    self.errorMessage = ko.observable(null);
    self.statementHistory = ko.observableArray([]);
    self.statement = ko.mapping.fromJS(new Statement());
    self.rootStatementValue = settings.rootStatementValue;
    self.descriptionCombineAlias = settings.descriptionCombineAlias;

    self.initialize = function () {
        self.errorMessage(null);
        self.statementHistory([]);
        self.loadStatement(self.rootStatementValue);
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
            childStatements: self.statement.childStatements(),
            relationshipValue: self.statement.relationshipValue(),
            relationshipSupportLevel: self.statement.relationshipSupportLevel()
        }));
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
    rootStatementValue: 'root',
    apiBaseUrl: '/statement.php?value=',
    descriptionCombineAlias: ', значит '
}));