var teamCityBaseUrl = "https://cors-anywhere.herokuapp.com/http://teamcity.jetbrains.com";
var baseProjectName = "OpenSourceProjects_EclipseCollections";
var branches = [];


//locator=policy:ACTIVE_VCS_BRANCHES
function initializeAllBranches() {
    $.getJSON(teamCityBaseUrl + "/app/rest/projects/"+baseProjectName+"/branches?&guest=1", function(data){

    }).done(function (data) {
        $.each(data.branch, function(i, branch){
            var safeBranchName = branch.name.replace("<","").replace(">","");
            var branchDiv = $("<div class='card panel panel-default mb-3' id='branch_"+ safeBranchName+"'></div>");
            var header = $("<div class='panel-leftheading'><h3 class='panel-lefttitle'>"+safeBranchName+"</h3></div>");
            var body = $("<div class='panel-rightbody card-body'></div>");
            var clearfix = $("<div class='clearfix'></div>");
            branchDiv.append(header);
            branchDiv.append(body);
            branchDiv.append(clearfix);

            branches.push(body);
            $("body").append(branchDiv)
        })
        initalizeProjectsWidgets("/app/rest/projects/id:" + baseProjectName);
    })
}

$( "document" ).ready(function() {
    initializeAllBranches();

});

function renderBuilds(builds) {
    $.getJSON(teamCityBaseUrl + builds.href+"/?locator=branch:default:any&guest=1", function(data){

    }).done(function (data) {
        $.each(data.build, function(i, build) {
            var buildConfigurationDiv = $("#buildConfiguration_"+build.buildTypeId+"_branch_"+build.branchName);
            //TODO: based on the status of the last N builds do something to the widget. Like make it red for failed, with number of tests etc.
            //errr, just make it success for now.
            buildConfigurationDiv.addClass('bg-success');
        })
    })

}

function fetchBuilds(buildHref) {
    $.getJSON(teamCityBaseUrl + buildHref+"?&guest=1", function(data){

    }).done(function (data) {
        renderBuilds(data.builds);
    })
}

function createBuildConfigurationWidgets(buildTypes, projectId) {
    $.each(buildTypes, function(i, buildConfiguration) {
        $.each(branches, function(i, branchDiv){
            var buildConfigurationDiv = $("<div class='buildConfiguration card' id='buildConfiguration_"+buildConfiguration.id+"_"+branchDiv[0].parentNode.id+"'>" + buildConfiguration.name + "</div>");
            var projectDivInBranch = $("#project_"+projectId+"_"+branchDiv[0].parentNode.id);

            projectDivInBranch.find('.card-columns').first().append(buildConfigurationDiv);
        });
        fetchBuilds(buildConfiguration.href);
    })

}

function initalizeProjectsWidgets(projectHref) {
    $.getJSON(teamCityBaseUrl + projectHref+"?&guest=1", function(data){

    }).done(function (data) {

        $.each(branches, function(i, branchDiv){
            var projectDiv = $("<div class='project' id='project_"+data.id+"_"+branchDiv[0].parentNode.id+"'></div>");
            var title = $("<h6></h6>");
            title.text(data.name);
            var buildContainer = $("<div class='card-columns'></div>");
            projectDiv.append(title);
            projectDiv.append(buildContainer);
            branchDiv.append(projectDiv);

        });
        createBuildConfigurationWidgets(data.buildTypes.buildType, data.id);
        $.each(data.projects.project, function(i, project) {
            initalizeProjectsWidgets(project.href);
        })

    })
}
