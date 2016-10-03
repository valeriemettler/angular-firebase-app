import {Injectable, Inject} from '@angular/core';
import {Observable, Subject} from "rxjs/Rx";
import {Lesson} from "./lesson";
import {AngularFireDatabase, FirebaseRef} from "angularfire2";


@Injectable()
export class LessonsService {

    sdkDb:any;

    constructor(private db:AngularFireDatabase, @Inject(FirebaseRef) fb) {

        this.sdkDb = fb.database().ref();

    }


    findAllLessons():Observable<Lesson[]> {

        return this.db.list('lessons')
            .do(console.log)
            .map(Lesson.fromJsonList);

    }

    findLessonByUrl(url:string):Observable<Lesson> {
        return this.db.list('lessons', {
            query: {
                orderByChild: 'url',
                equalTo: url
            }
        })
        .filter(results => results && results.length > 0)
        .map(results => Lesson.fromJson(results[0]))
        .do(console.log);
    }


    loadNextLesson(courseId:string, lessonId:string):Observable<Lesson> {
        return this.db.list(`lessonsPerCourse/${courseId}`, {
            query: {
                orderByKey:true,
                startAt: lessonId,
                limitToFirst: 2
            }
        })
        .map(results => results[1].$key)
        .switchMap(lessonId => this.db.object(`lessons/${lessonId}`))
        .map(Lesson.fromJson);
    }


    loadPreviousLesson(courseId:string, lessonId:string):Observable<Lesson> {
        return this.db.list(`lessonsPerCourse/${courseId}`, {
            query: {
                orderByKey:true,
                endAt: lessonId,
                limitToLast: 2
            }
        })
        .map(results => results[0].$key)
        .switchMap(lessonId => this.db.object(`lessons/${lessonId}`))
        .map(Lesson.fromJson);

    }

    createNewLesson(courseId:string, lesson:any): Observable<any> {

        const lessonToSave = Object.assign({}, lesson, {courseId});

        const newLessonKey = this.sdkDb.child('lessons').push().key;

        let dataToSave = {};

        dataToSave["lessons/" + newLessonKey] = lessonToSave;
        dataToSave[`lessonsPerCourse/${courseId}/${newLessonKey}`] = true;


        return this.firebaseUpdate(dataToSave);
    }

    firebaseUpdate(dataToSave) {
        const subject = new Subject();

        this.sdkDb.update(dataToSave)
            .then(
                val => {
                    subject.next(val);
                    subject.complete();

                },
                err => {
                    subject.error(err);
                    subject.complete();
                }
            );

        return subject.asObservable();
    }


    saveLesson(lessonId:string, lesson): Observable<any> {

        const lessonToSave = Object.assign({}, lesson);
        delete(lessonToSave.$key);

        let dataToSave = {};
        dataToSave[`lessons/${lessonId}`] = lessonToSave;

        return this.firebaseUpdate(dataToSave);


    }



}











