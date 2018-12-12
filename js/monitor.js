var teamCityBaseUrl = "https://cors-anywhere.herokuapp.com/http://teamcity.jetbrains.com";
var baseProjectName = "OpenSourceProjects_EclipseCollections";
var branchDivs = [];
var branchIds = [];


//locator=policy:ACTIVE_VCS_BRANCHES
function initializeAllBranches() {
    $.getJSON(teamCityBaseUrl + "/app/rest/projects/" + baseProjectName + "/branches?locator=policy:ACTIVE_VCS_BRANCHES&guest=1", function (data) {

    }).done(function (data) {
        $.each(data.branch, function (i, branch) {
            var safeBranchName = branch.name.replace("<", "").replace(">", "");
            var branchDiv = $("<div class='card panel panel-default mb-3' id='branch_" + safeBranchName + "'></div>");
            var header = $("<div class='panel-leftheading'><h3 class='panel-lefttitle'>" + safeBranchName + "</h3></div>");
            var body = $("<div class='panel-rightbody card-body'></div>");
            var clearfix = $("<div class='clearfix'></div>");
            branchDiv.append(header);
            branchDiv.append(body);
            branchDiv.append(clearfix);
            branchIds.push(branch.name);
            branchDivs.push(body);
            $("body").append(branchDiv)
        })
        initalizeProjectsWidgets("/app/rest/projects/id:" + baseProjectName);
    })
}

$("document").ready(function () {
    initializeAllBranches();

});

function fetchBuidStatus(buildConfigurationDiv, branchName, buildTypeId) {
    buildConfigurationDiv.removeClass("bg-danger");
    buildConfigurationDiv.removeClass("bg-success");
    buildConfigurationDiv.addClass("bg-secondary");
    $.getJSON(teamCityBaseUrl + "/app/rest/builds/?locator=branch:" + branchName + ",buildType:" + buildTypeId + ",count:3&guest=1", function (data) {

    }).done(function (data) {
        //TODO: Show all the things on the builds we want to see.
        //Is it running?
        //How many tests passed / failed
        //etc
        $.each(data.build, function (i, build) {
            buildConfigurationDiv.removeClass("bg-secondary");
            var foo = data;
            if (build.status === "SUCCESS") {
                buildConfigurationDiv.addClass("bg-success");
            } else {
                buildConfigurationDiv.addClass("bg-danger");
            }

        })
    })
}

function registerBuildUpdateCallback(buildConfigurationDiv, buildTypeId, branchName, callbackFrequency) {
    window.setInterval(function(){
        fetchBuidStatus(buildConfigurationDiv, branchName, buildTypeId);
    }, callbackFrequency);

};

function renderBuilds(buildTypeId) {
    $.each(branchIds, function (i, branchId) {
        var buildConfigurationDiv = $("#buildConfiguration_" + buildTypeId + "_branch_" + branchId);
        fetchBuidStatus(buildConfigurationDiv, branchId, buildTypeId);
        registerBuildUpdateCallback(buildConfigurationDiv, buildTypeId, branchId, 60000);
    })
}

function createBuildConfigurationWidgets(buildTypes, projectId) {
    $.each(buildTypes, function (i, buildConfiguration) {
        $.each(branchDivs, function (i, branchDiv) {
            var buildConfigurationDiv = $("<div class='buildConfiguration card' id='buildConfiguration_" + buildConfiguration.id + "_" + branchDiv[0].parentNode.id + "'>" + buildConfiguration.name + "</div>");
            var projectDivInBranch = $("#project_" + projectId + "_" + branchDiv[0].parentNode.id);

            projectDivInBranch.find('.card-columns').first().append(buildConfigurationDiv);
        });
        renderBuilds(buildConfiguration.id);
    })

}

function initalizeProjectsWidgets(projectHref) {
    $.getJSON(teamCityBaseUrl + projectHref + "?&guest=1", function (data) {

    }).done(function (data) {

        $.each(branchDivs, function (i, branchDiv) {
            var projectDiv = $("<div class='project' id='project_" + data.id + "_" + branchDiv[0].parentNode.id + "'></div>");
            var title = $("<h6></h6>");
            title.text(data.name);
            var buildContainer = $("<div class='card-columns'></div>");
            projectDiv.append(title);
            projectDiv.append(buildContainer);
            branchDiv.append(projectDiv);

        });
        createBuildConfigurationWidgets(data.buildTypes.buildType, data.id);
        $.each(data.projects.project, function (i, project) {
            initalizeProjectsWidgets(project.href);
        })

    })
}
