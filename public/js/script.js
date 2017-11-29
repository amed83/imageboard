
(function(){
    Handlebars.templates = Handlebars.templates ||{}

    var templates = document.querySelectorAll('template');

    Array.prototype.slice.call(templates).forEach(function(tmpl) {
        Handlebars.templates[tmpl.id] = Handlebars.compile(tmpl.innerHTML.replace(/{{&gt;/g, '{{>'));
    });

    Handlebars.Handlebars=Handlebars.templates;




    var ImagesModel = Backbone.Model.extend({
       initialize:function(){
           this.fetch();
       },
        url:'/images'
    })

    var ImagesView= Backbone.View.extend({
       initialize:function(){
           this.upload= arguments[0].upload;
           var view = this;
           this.upload.on('success',function(){
               view.model.fetch()
           })
            this.model.on('change',function(){
               view.render()
           });
       },
       render:function(){
           var renderedTemplate =  Handlebars.templates.homepage(this.model.toJSON());
           this.$el.html(renderedTemplate)
               $('#uploadimg-button').click(function(){
               $('#modal').removeClass('hidden')
               $('#modal').addClass('animate')
               });
               $('#closeUpload').click(function(){
                   $('#modal').addClass('hidden')
               })
       },
       events:{
           'click #img-upload-button': function(e){
             e.preventDefault()
             var file = $('input[type="file"]').get(0).files[0];
             var username = $('input[name="username"]').val();
             var title = $('input[name="title"]').val();
             var description = $('input[name="description"]').val();
             this.upload.set({
                 file:file,
                 username:username,
                 title:title,
                 description:description
             })
             this.upload.savePictu()
           }
       }
    })

    var UploadModel= Backbone.Model.extend({
       savePictu: function(){
           var file=this.get('file')
           var formData = new FormData();
           var model= this
           formData.append('file', file);
           formData.append('username',this.get('username'));
           formData.append('title',this.get('title'));
           formData.append('description',this.get('description'));
           $.ajax({
             url: '/upload',
             method: 'POST',
             data: formData,
             processData: false,
             contentType: false,
             success:function(){
             model.trigger('success')
             }
          });
       },
        url:'/upload'
    })

    var BigImgView = Backbone.View.extend({
        initialize:function(){
            var view = this;
            this.model.on('change',function(){
                view.render()
                new CommentsView({
                    el:'#comments-form',
                    model:new CommentsModel({imageId:view.model.get('id')})
                })
            });
       },
        render:function(){
           var myHtml = Handlebars.templates.biggerImg(this.model.toJSON());
           this.$el.html(myHtml)
       }
    })

    var BiggerModel = Backbone.Model.extend({
        initialize:function(){
            this.fetch()
        },
        url: function(){
            return '/singleImg/' + this.get('id')
        }
    })

    var CommentsModel= Backbone.Model.extend({
        initialize:function(){
            this.fetch()
        },
        url:function(){
            return '/comments/' + this.get('imageId')
        }
    })


    var CommentsView= Backbone.View.extend({
        initialize:function(){
            var view = this
            this.model.on('change', function(){
                view.render()
            })
        },
        render:function(){
            var myHtml=Handlebars.templates.commentsForm(this.model.toJSON());
            this.$el.html(myHtml)
        },
        events:{
            'click #saveComment': function(e){
                e.preventDefault()
                 var comment = this.$el.find('textarea[name="comment"]').val()
                 var username = this.$el.find('input[name="username"]').val()
                 var view = this;

                this.model.save({
                    comment:comment,
                    username:username
                }, {
                    success:function(){

                        view.model.fetch()
                    }
                })
            }
        }
    })


    var main = $('#main')

    var Router = Backbone.Router.extend({
        routes:{
            '':'home',
            'image/:imageId':'image',
        },
        image:function(imageId){
            main.off();
            var model = new BiggerModel({
                id:imageId
            });
            var view =new BigImgView({
                model: model,
                el:'#main'
             })
        },
        home:function(){
            main.off();
            var view =new ImagesView({
               model: new ImagesModel,
               upload: new UploadModel,
               el:'#main'
           })
       }
    })

    var router = new Router;
    Backbone.history.start();
})();
