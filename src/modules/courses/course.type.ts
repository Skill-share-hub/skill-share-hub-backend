export type QueryType = {
  _id : any;
  category: string
  status : string;
  courseType: string
  title: {
    $regex: string
    $options: string
  },
  contentModules : any;
  $or : any,
  price : {
    $gte : number,
    $lte : number
  }
  creditCost : {
    $gte : number,
    $lte : number
  },
  ratingsAverage : {$gte :number}
  
}

export type SortType = {
  createdAt?: 1 | -1
  totalEnrollments?: 1 | -1
  ratingsAverage?: 1 | -1
}

export type MulterFiles = {
  contentUrl?: Express.Multer.File & { location: string }[]
  thumbnailUrl?: Express.Multer.File & { location: string }[]
}