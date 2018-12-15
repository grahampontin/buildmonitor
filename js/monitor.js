var teamCityBaseUrl = "https://cors-anywhere.herokuapp.com/http://teamcity.jetbrains.com";
var baseProjectName = "ApacheIvy";
var branchDivs = [];
var branchIds = [];


function getSafeBranchName(branchId) {
    return branchId.replace("<", "").replace(">", "").replace(/\//g, "_");
}

//locator=policy:ACTIVE_VCS_BRANCHES
function initializeAllBranches() {
    $.getJSON(teamCityBaseUrl + "/app/rest/projects/" + baseProjectName + "/branches?locator=policy:ACTIVE_VCS_BRANCHES&guest=1", function (data) {

    }).done(function (data) {
        $.each(data.branch, function (i, branch) {
            var safeBranchName = getSafeBranchName(branch.name);
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

function resetStyle(buildConfigurationDiv) {
    buildConfigurationDiv.removeClass("bg-danger");
    buildConfigurationDiv.removeClass("border-danger");
    buildConfigurationDiv.removeClass("text-danger");
    buildConfigurationDiv.removeClass("bg-success");
    buildConfigurationDiv.removeClass("text-white");
    buildConfigurationDiv.removeClass("border-success");
    buildConfigurationDiv.removeClass("text-success");
}

function markSuccess(buildConfigurationDiv, isRunning) {
    resetStyle(buildConfigurationDiv);
    if (isRunning){
        buildConfigurationDiv.addClass("border-success");
        buildConfigurationDiv.addClass("text-success");
    } else {
        buildConfigurationDiv.addClass("bg-success");
        buildConfigurationDiv.addClass("text-white");
    }
    var progress = buildConfigurationDiv.find(".progress-bar");
    progress.removeClass("bg-danger");
    progress.addClass("bg-success");
}

function markFailure(buildConfigurationDiv, build, isRunning) {
    $.getJSON(teamCityBaseUrl + build.href + "?guest=1", function (data) {
        var t = data;
    }).done(function (data) {
        var body = buildConfigurationDiv.find(".card-body");
        if (data.testOccurrences !== undefined){
            body.text(data.testOccurrences.failed);
            body.addClass("testCount");
        } else {
            body.removeClass("testCount");
            body.text(data.statusText);
        }
        resetStyle(buildConfigurationDiv);
        if (isRunning){
            buildConfigurationDiv.addClass("border-danger");
            buildConfigurationDiv.addClass("text-danger");
        } else {
            buildConfigurationDiv.addClass("bg-danger");
            buildConfigurationDiv.addClass("text-white");
        }
        var progress = buildConfigurationDiv.find(".progress-bar");
        progress.addClass("bg-danger");
        progress.removeClass("bg-success");
    }).fail(function(data) { alert('getJSON request failed! '); });

}

function hideProgress(buildConfigurationDiv) {
    buildConfigurationDiv.find(".progress").hide();
}

function showProgress(buildConfigurationDiv, percentageComplete) {

    var progressContainer = buildConfigurationDiv.find(".progress");
    var progressBar = progressContainer.find(".progress-bar");
    progressBar.attr("aria-valuenow",percentageComplete);
    progressBar.attr("style", "width: " + percentageComplete + "%");
    progressContainer.show();
}

function fetchBuidStatus(buildConfigurationDiv, branchName, buildTypeId) {
    var branch = encodeURI(branchName);
    if (branchName === "<default>"){
        branch = "default:true"
    }
    $.getJSON(teamCityBaseUrl + "/app/rest/builds/?locator=branch:" + branch + ",buildType:" + buildTypeId + ",running:any,count:1&guest=1", function (data) {

    }).done(function (data) {
        //TODO: Show all the things on the builds we want to see.
        //Is it running?
        //How many tests passed / failed
        //etc
        $.each(data.build, function (i, build) {
            var isRunning = build.state === "running";
            if (build.status === "SUCCESS") {
                markSuccess(buildConfigurationDiv, isRunning);
            } else if (build.status === "FAILURE") {
                markFailure(buildConfigurationDiv, build, isRunning);
            }
            if (isRunning){
                showProgress(buildConfigurationDiv, build.percentageComplete);
            } else {
                hideProgress(buildConfigurationDiv);

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
        var buildConfigurationDiv = $("#buildConfiguration_" + buildTypeId + "_branch_" + getSafeBranchName(branchId));
        fetchBuidStatus(buildConfigurationDiv, branchId, buildTypeId);
        registerBuildUpdateCallback(buildConfigurationDiv, buildTypeId, branchId, 10000);
    })
}

function createBuildConfigurationWidgets(buildTypes, projectId) {
    $.each(buildTypes, function (i, buildConfiguration) {
        $.each(branchDivs, function (i, branchDiv) {
            var buildConfigurationDiv = $("<div class='buildConfiguration card' id='buildConfiguration_" + buildConfiguration.id + "_" + branchDiv[0].parentNode.id + "'><div class='card-header'>" + buildConfiguration.name + "</div>" +
                "<div class='card-body testCount'>" +
                "   <div class=\"progress\">\n" +
                "       <div class='progress-bar' role='progressbar' aria-valuemin='0' aria-valuemax='100'></div>" +
                "    </div>" +
                "</div>" +
                "</div>");
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
