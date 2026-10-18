import mongoose,{Schema,models} from "mongoose";
const guidanceNoteSchema=new Schema({guide:{type:Schema.Types.ObjectId,ref:"User",required:true,index:true},student:{type:Schema.Types.ObjectId,ref:"User",required:true,index:true},title:{type:String,required:true,trim:true,maxlength:160},note:{type:String,required:true,trim:true,maxlength:3000},followUpDate:{type:Date,default:null}},{timestamps:true});
const GuidanceNote=models.GuidanceNote||mongoose.model("GuidanceNote",guidanceNoteSchema);export default GuidanceNote;
