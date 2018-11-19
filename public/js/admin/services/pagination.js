
app.service('pagination', function(){
    this.pages = function(data, page){
        /*
            data = {
                total_count: 1,
                page_count: 1,
                results: []
            }
            => {
                total_count: 1,
                page_count: 1,
                results: [],
                page_index: page,
                pages: [],
            }
            */
        data.page_index = page;
        data.pages = [];
        var N = 5;
        var s = Math.floor(page/N) * N;
        if(s === page) s -= N;
        s += 1;
        var e = Math.min(data.page_count, s+N-1);
        for(var i=s;i<=e;i++) data.pages.push(i);
    };
});