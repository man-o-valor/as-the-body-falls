const { Events } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready to go! Logged in as ${client.user.tag} :)`)
	},
};