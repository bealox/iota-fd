var socket = io();
const maxHistory = 16;
Chart.defaults.global.legend.display = false;

// Master meta config

var sidebarConfig = {
	'el': '#navbar',
	data: {
		loggedIn:'',
		address: ''
	},
	methods: {
		addPeer: function (event) {
			// `this` inside methods points to the Vue instance
			//alert('Adding Peer ' + this.address + '!')
			// `event` is the native DOM event
			var normalizedAddress = this.address.replace(/\s/g, '');
			socket.emit('addPeer', { address: normalizedAddress });
		}
	}
};
var sidebar = new Vue(sidebarConfig);


// Master meta config
var peers = {};

var peerTemplate = {
	'el': '#peers',
	'template':  `<div id='peer-wrapper'>      
     <peer v-for='peer in peers' :key='peer.address' v-bind:state=peer></peer>
  </div>   `,
	data : {
		peers: [    
		]
	},
	

};
var vm = new Vue(peerTemplate);     

// <div class="row" v-if="loggedIn === true">
// 	<div class="col-lg-9">
// 		<input type="text" v-model="address" placeholder="E.g. udp://11.22.33.44:18400" class="form-control">
// 				</div>
// 		<div class="col-lg-3">
// 			<button type="button" v-on: click="addPeer" class="btn btn-success">Add Peer</button>
// 	</div>
// </div>


var systemTemplate = {
	'el': '#systeminfo',
	'template':  `
	<div id='systemInfo'> 

	<div class="version card">
		<h5>IRI 
			<a href="https://github.com/iotaledger/iri/releases" v-if-not="hasLatestIRI" target="blank" style="color:#FF456B">
				<i class="fa faa-pulse animated fa-heart" aria-hidden="true" title="new version"></i>
				new
			</a>
		</h5> 
		<h5>v {{nodeInfo.appVersion}}</h5>
	</div>
	<div class="iota-version card">
		<h5>IOTA-Fd </h5> 
		<h5>v 0.0.1</h5>
	</div>
	<div class="latest-index card" title="Latest Milestone Index">

	<span class="lsmi">
		<h5>LSMI</h5>
		<h5> {{nodeInfo.latestSolidSubtangleMilestoneIndex}}</h5>
		</span>

		<h5>LMI</h5>  
		<h5>{{nodeInfo.latestMilestoneIndex}}</h5>
		
	</div>
	<div class="cpu card" title="Latest Solid Milestone Index">
		<h5>CPU</h5>
		<h5>{{cpuUsage}}</h5>
	</div>
	</div>
  `,
	'data' : {
		latestIRIVersion: '',
		loggedIn: '',
		address: '',
		nodeInfo : {
			appName: 'IRI Testnet',
			appVersion: '1.1.3.10',
			jreAvailableProcessors: 2,
			jreFreeMemory: 8948256,
			jreVersion: '1.8.0_131',
			jreMaxMemory: 100,
			jreTotalMemory: 50,
			latestMilestone: 'SWDRPWLUPTGYBD9XRFMPAPBHHYZPWVYBGWOMPZLMWCAVJPMIKLPFBLXQ9CCTLPGDZNLJLQAVAAKL99999',
			latestMilestoneIndex: 0,
			latestSolidSubtangleMilestone: '999999999999999999999999999999999999999999999999999999999999999999999999999999999',
			latestSolidSubtangleMilestoneIndex: 0,
			neighbors: 10,
			packetsQueueSize: 0,
			time: 1499089430275,
			tips: 2316,
			transactionsToRequest: 4549,
			duration: 0 }
	},
	methods: {
		addPeer: function (event) {
			// `this` inside methods points to the Vue instance
			//alert('Adding Peer ' + this.address + '!')
			// `event` is the native DOM event
			var normalizedAddress = this.address.replace(/\s/g, '');
			socket.emit('addPeer', { address: normalizedAddress });
		},
		showNeighbors: function (event){
			var n = '';
			vm.peers.forEach(function(peer){
				n +=  peer.connectionType + '://' + peer.address + '\n'; 
			});
			var  display = '<pre class=\'code-preview text-left p-a\'>'+ n + '</pre>';
			swal({
		  title:'List of Neighbours',
		  html: display
			});			
		}
	},
	computed:{
		cpuUsage : function(){
			return ((Math.floor((this.nodeInfo.jreTotalMemory / this.nodeInfo.jreMaxMemory) * 100))) + '%';
		},
		hasLatestIRI: function(){
			if(this.latestIRIVersion)
				return true;
			
			var filteredCurrentIRI = 'v' +this.nodeInfo.appVersion; 

			return filteredCurrentIRI === this.latestIRIVersion;
		}
	}     
};

var system = new Vue (systemTemplate);


var data = {}; 


socket.on('peerDeleted', function(info){
	var index = _.findIndex(vm.peers, function(obj){ return obj.address == info.address.split('//')[1]; });
	vm.peers.splice(index, 1);
   
});

socket.on('peerInfo', function(info){
	var item = _.find(vm.peers, function(obj){ return obj.address == info.address; });
	// { type: 'dio', state: { id: 0, status: true } }
	//if (item == undefined) item = vm[msg.type].state[0];
	if (item) {
		//info.address = undefined;
		var time = new Date();
        
		var seconds = time.getSeconds();
		var minutes = time.getMinutes();
		var hour = time.getHours();
        
		var obj = Object.assign({},item.history);
		obj.labels.push(''+hour+':'+minutes+':'+seconds);
        
		if ( obj.labels.length > maxHistory) obj.labels.shift();
        
		obj.datasets[0].data.push(info.numberOfAllTransactions - item.numberOfAllTransactions );
		if ( obj.datasets[0].data.length > maxHistory) obj.datasets[0].data.shift();
        
		obj.datasets[1].data.push(info.numberOfNewTransactions - item.numberOfNewTransactions);
		if ( obj.datasets[1].data.length > maxHistory) obj.datasets[1].data.shift();
        
		obj.datasets[2].data.push(info.numberOfSentTransactions - item.numberOfSentTransactions);
		if ( obj.datasets[2].data.length > maxHistory) obj.datasets[2].data.shift();

		Object.assign(item, info);
        
		Vue.set(item, 'history', obj); 
		//debugger;
        
	}
	else{
		info.history = { 
			labels: [],
			datasets: [
				{
					label: 'Rec TX',
					borderColor: '#FF456B',
					backgroundColor: 'rgba(255,106,136, 0.5)',
					data: [2,4,20,11,21]
				},
				{
					label: 'New TX',
					borderColor: '#6bff45',
					backgroundColor: 'rgba(107,255,69, 0.5)',
					Opacity: 0.3, 
					data: [2,10,5,1,3]
				},
				{
					label: 'Sent TX',
					borderColor: '#456bff',
					backgroundColor: 'rgba(106,136,255, 0.5)',
					data: [10, 3, 5,6]
				},
            
			]
		};
        
		vm.peers.push(Object.assign({},info));
        
	}
	vm.peers.sort(function(a, b) {
		return b.numberOfNewTransactions - a.numberOfNewTransactions;
	});
    

});


socket.on('init', function(info){	

	Vue.set(system, 'loggedIn', info.loggedInfo);
	Vue.set(sidebar, 'loggedIn', info.loggedInfo);
	
	if(!info.loggedInfo)
		document.cookie = 'iota-fd=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
});

socket.on('nodeInfo', function(info){
	system.nodeInfo = info;
});

socket.on('latestIRIVersion', function (tagName) {
	console.log('------ ' + tagName);
	if (tagName)
		Vue.set(system, 'latestIRIVersion', tagName);
});

socket.on('result', function(info){
	swal('Response',
		info,
		'info'
	);
});
