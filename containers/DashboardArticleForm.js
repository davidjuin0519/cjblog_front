import React, { Component } from 'react'
import { EditorState, ContentState } from 'draft-js'
import { stateFromHTML } from 'draft-js-import-html'
import EditorBox from './Editor'
import config from '../config'

export default class ArticleForm extends Component {
  constructor() {
    super();
    this.state = { 
      url: '',
      method: '',
      name: '', 
      title: '',
      is_presented: '',
      tags: [],
      checked: [] 
    }
    this.load                 = () => this._load();
    this.loadTags             = () => this._loadTags();
    this.handleSubmit         = (text) => this._handleSubmit(text)
    this.handleTagSubmit      = (article_id) => this._handleTagSubmit(article_id)
    this.handleInputChange    = (e) => this._handleInputChange(e);
    this.renderTags           = () => this._renderTags()
    this.renderPresentOptions = () => this._renderPresentOptions()
  }
  componentDidMount() {
    if(this.props.params.action=='new') {
      this.setState({
        url: config.domain + '/dashboard/articles.json',
        method: 'POST'
      })
    } else {
      this.setState({
        url: config.domain + '/dashboard/articles/' + this.props.params.id +  '.json',
        method: 'PUT'
      }, () => this.load())
    }
    this.loadTags()
  }
  _load() {
    $.ajax({
      url: this.state.url,
      dataType: 'json',
      xhrFields: { withCredentials: true }
    }).
    done((data) => {
      this.setState({ 
        name: data.name, 
        title: data.title, 
        is_presented: data.is_presented.toString(),
        checked: data.tags.map((tag) => {return tag.id}) 
      })
      var contentState = stateFromHTML(data.text);
      var editorState = EditorState.createWithContent(contentState);
      this.refs.editor.setState({ editorState: editorState })
    })
  }
  _loadTags() {
    $.ajax({
      url: config.domain + '/dashboard/tags.json',
      dataType: 'json',
      xhrFields: { withCredentials: true }
    }).
    done((data) => {
      this.setState({ tags: data })
    })
  }
  _handleSubmit(text) {
    var payload = { 
      article: { 
        name:  this.state.name, 
        title: this.state.title, 
        text:  text,
        is_presented: this.state.is_presented
      } 
    }
    $.ajax({
      url: this.state.url,
      dataType: 'json',
      data: payload,
      type: this.state.method,
      xhrFields: { withCredentials: true },
      success: function(data) {
        this.handleTagSubmit(data.article_id);
      }.bind(this),
      error: function(xhr) {
      }.bind(this)
    });
  }
  _handleTagSubmit(article_id) {
    var data = { tag_ids: this.state.checked };
    $.ajax({
      url: config.domain + '/dashboard/articles/' + article_id + '/update_tags.json',
      dataType: 'json',
      data: data,
      type: 'POST',
      xhrFields: { withCredentials: true },
      success: function(data) {
        console.log(data)
      }.bind(this),
      error: function(xhr) {
      }.bind(this)
    });
  }
  _handleInputChange(e) {
    switch(e.target.name) {
      case 'tag':
        var checked = $.extend([], this.state.checked);
        var id = parseInt(e.target.value);
        var index = checked.indexOf(id)
        index==-1 ? checked.push(id) : checked.splice(index, 1)
        this.setState({ checked: checked })
      case 'is_presented':
        this.setState({
          is_presented: e.target.value=='true'
        });
      default:
        var state = {};
        state[e.target.name] = e.target.value;
        this.setState(state);
    }
  }
  _renderTags() {
    var tags = this.state.tags.map((tag)=>{
      return (
        <span key={tag.id}>
          <input type='checkbox' 
                 name='tag' 
                 value={tag.id} 
                 checked={this.state.checked.includes(tag.id)}
                 onClick={this.handleInputChange}/>{tag.title}&nbsp;&nbsp;
        </span>
      )
    })
    return tags;
  }
  _renderPresentOptions() {
    return (
      <div>
        <label>顯示</label><br/>
        <input type="radio" name="is_presented" value={true} checked={this.state.is_presented=='true'} onChange={this.handleInputChange} /> 是
        &nbsp;&nbsp;
        <input type="radio" name="is_presented" value={false} checked={this.state.is_presented=='false'} onChange={this.handleInputChange} /> 否<br/>
      </div>
    )
  }
  render() {
    return (
      <div>
        <label>名稱</label>
        <input type='text' name='name' value={this.state.name} onChange={this.handleInputChange} />
        <br/>
        <label>標題</label>
        <input type='text' name='title' value={this.state.title} onChange={this.handleInputChange} />
        <br/>
        <label>標籤</label><br/>
        {this.renderTags()}
        {this.renderPresentOptions()}
        <EditorBox ref='editor' onSubmit={this.handleSubmit} />
      </div>
    )
  }
}