// JavaScript Document
var my$ = jQuery.noConflict();
var myCounterPojects = 0;

my$(document).ready(function(){

	my$.getJSON('js/data.json', function(data) {
		var projects = data.portfolio.projects;
		createRow(projects);
	});

	prettyPrint();
	
});

function createRow(projects){

	if(myCounterPojects < projects.length){
		my$.zrow({
			items:projects[myCounterPojects].project,
			onComplete:function(){createRow(projects)},
			inParallelLoad:false,
			target:my$('div.projects')
		});

		myCounterPojects++;
	}else{
		return;
	}
}