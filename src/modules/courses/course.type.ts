export type QueryType = {
  category?: string
  courseType?: string
  title?: {
    $regex: string
    $options: string
  },
  $or ?: any
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