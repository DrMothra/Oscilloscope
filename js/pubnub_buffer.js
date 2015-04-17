(function(){

    var root = this;

    var PubNubBuffer;
    if (typeof exports !== 'undefined') {
        PubNubBuffer = exports;
    } else {
        PubNubBuffer = root.PubNubBuffer = {};
    }


    function Channel(channel, subscribe_key, latency, size){

        console.log(channel + subscribe_key);
 
        this.timestamp_buffer = new Array(size);
        this.value_buffer = new Array(size);
        this.index = 0;

        this.offset = undefined;
        this.latency = latency;
        this.size = size;

        this.channelnames = undefined;
        this.channeltypes = undefined;
 
        var ch = this;

        // Init
        var pubnub = PUBNUB.init({
            subscribe_key : subscribe_key
        });

        // LISTEN
        pubnub.subscribe({
            channel: channel,
            message: function (msg) {
                var now = new Date().getTime();

                try {
                    if ("data" in msg) {

                        var data = msg.data;


                        ch.channelnames = msg.channelnames;
                        ch.channeltypes = msg.channeltypes;

                        if (ch.offset === undefined) {
                            var first = data[0][0] * 1000.0;
                            ch.offset = (now - first) + ch.latency;
                        }

                        for (var i = 0; i < data.length; i++) {
                            ch.timestamp_buffer[ch.index] = data[i][0] * 1000.0;
                            ch.value_buffer[ch.index] = data[i][1];
                            ch.index++;
                            if (ch.index > ch.size - 1) {
                                ch.index = 0;
                            }
                        }
                    } else {
                        console.log('Msg =', msg);
                    }
                }
                catch (err) {
                    console.log("Likely a sync message");
                }
            }

        })
    }


    Channel.prototype.getLastValue = function(channelname){

        if(this.channelnames === undefined){
            return undefined;
        }

        var now = new Date().getTime();
        var due = now - this.offset;

        var search_from = this.index - 1;
        if(search_from == - 1){
            search_from = this.size - 1;
        }

        var i;

        var channelindex = this.channelnames.indexOf(channelname);

        if(channelindex == -1){
            return undefined;
        }

        var channeltype = this.channeltypes[channelindex];

        for(i=search_from; i > -1; i--){
            if(this.timestamp_buffer[i] !== undefined){
                if(this.timestamp_buffer[i] <= due){
                    return { data: this.value_buffer[i][channelindex],
                        timeStamp: this.timestamp_buffer[i]};
                }
            }
	    }
 
        for(i=this.size - 1; i > search_from ; i--){
            if(this.timestamp_buffer[i] !== undefined){
                if(this.timestamp_buffer[i] <= due){
                    return { data: this.value_buffer[i][channelindex],
                        timeStamp: this.timestamp_buffer[i]};
                }
            }
        }

        return undefined;
    };

    Channel.prototype.getChannelNames = function() {
        return this.channelnames;
    };

    Channel.prototype.getChannelTypes = function() {
        return this.channeltypes;
    };


    PubNubBuffer.subscribe = function(channel, subscribe_key, latency, size){

         return new Channel(channel, subscribe_key, latency, size);
    }

}).call(this);