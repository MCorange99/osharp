#!/usr/bin/env node
const assert = require('assert');
const { exit } = require("process")
const process = require("process")
const fs = require("fs")//.promises
const util = require('util');
const exec = util.promisify(require('child_process').exec);
let argv = process.argv
let result
let iota_counter = 0;
function iota(reset=false){
	
	if (reset) iota_counter = 0;
	result = iota_counter;
	iota_counter++;
	return result;
}

let OP_PUSH = iota(true);
let OP_PLUS = iota();
let OP_MINUS = iota();
let OP_DUMP = iota();
let COUNT_OPS= iota();

function fpush(x){
	return [OP_PUSH, x]
}

function plus(){
	return [OP_PLUS, null]
}

function minus(){
	return [OP_MINUS, null]
}

function dump(){
	return [OP_DUMP, null]
}

function simProg(prog){
	let i, op
	let stack = []
	for(i = 0; i < prog.length; i++){
		op = prog[i];
		assert(COUNT_OPS == 4, "Exhaustive handling of operations in simulation")
		if (op[0] == OP_PUSH){
			stack.push(op[1])
		} else
		if (op[0] == OP_PLUS){
			let a = stack.pop()
			let b = stack.pop()
			stack.push(a + b)
		} else
		if (op[0] == OP_MINUS){
			let a = stack.pop()
			let b = stack.pop()
			stack.push(b - a)
		} else
		if (op[0] == OP_DUMP){
			let a = stack.pop()
			console.log(a)
		} else {
			assert(false, "unreachable");
		}
	}
}
async function writeFile(filePath, text, mode='w'){
	//fs.open(filePath, 'w');
	if (mode == 'c'){
		try {
			await fs.writeFile(filePath, text, function(err){
				
				if (err) console.log(err)
			});
		} catch (error) {
			console.error(`Got an error trying to write to a file: ${error.message}`);
		}
	} else
	if (mode == 'w'){
		try {
			await fs.appendFile(filePath, text, function(err){
				
				if (err) console.log(err)
			});
		} catch (error) {
			console.error(`Got an error trying to write to a file: ${error.message}`);
		}
	} else
	if (mode == 'r'){
		assert(false, "TODO: not implemented, reading files")
	}

}

function removeEmpty(arr){
	arr = arr.filter((el) => {
		return el !== null && el !== '' && typeof el !== 'undefined';
	})
	return arr
}

function parsePath(filePath, noEndSlash){
	let fileName, path
	if (filePath.includes('/')){
		let fileNameTmp = filePath.split('/')
		let pathTmp = fileNameTmp
		fileName = pathTmp.pop()
		baseName = fileName.split('.')[0]
		path = pathTmp.join('/')
	} else {
		baseName = filePath.split('.')[0]
		fileName = filePath
		path = '.'
	}
	if (noEndSlash) return [fileName, path, baseName]

	return [fileName, path + '/', baseName]
}

async function comProg(prog, filePath){
	const [fileName, path, baseName] = parsePath(filePath)
	let filePathAsm = `${path + baseName}.asm`
	let filePathExec = `${path + baseName}`
	let filePathObj = `${path + baseName}.o`
	console.log(`INFO: writing file ${path + baseName}.asm`)
	writeFile(filePathAsm, ";; -- start --\n", 'c')
	writeFile(filePathAsm, "segment .text\n")
	writeFile(filePathAsm, "dump:\n")
	writeFile(filePathAsm, "	mov     r9, -3689348814741910323\n")
	writeFile(filePathAsm, "	sub     rsp, 40\n")
	writeFile(filePathAsm, "	mov     BYTE [rsp+31], 10\n")
	writeFile(filePathAsm, "	lea     rcx, [rsp+30]\n")
	writeFile(filePathAsm, ".L2:\n")
	writeFile(filePathAsm, "	mov     rax, rdi\n")
	writeFile(filePathAsm, "	lea     r8, [rsp+32]\n")
	writeFile(filePathAsm, "	mul     r9\n")
	writeFile(filePathAsm, "	mov     rax, rdi\n")
	writeFile(filePathAsm, "	sub     r8, rcx\n")
	writeFile(filePathAsm, "	shr     rdx, 3\n")
	writeFile(filePathAsm, "	lea     rsi, [rdx+rdx*4]\n")
	writeFile(filePathAsm, "	add     rsi, rsi\n")
	writeFile(filePathAsm, "	sub     rax, rsi\n")
	writeFile(filePathAsm, "	add     eax, 48\n")
	writeFile(filePathAsm, "	mov     BYTE [rcx], al\n")
	writeFile(filePathAsm, "	mov     rax, rdi\n")
	writeFile(filePathAsm, "	mov     rdi, rdx\n")
	writeFile(filePathAsm, "	mov     rdx, rcx\n")
	writeFile(filePathAsm, "	sub     rcx, 1\n")
	writeFile(filePathAsm, "	cmp     rax, 9\n")
	writeFile(filePathAsm, "	ja      .L2\n")
	writeFile(filePathAsm, "	lea     rax, [rsp+32]\n")
	writeFile(filePathAsm, "	mov     edi, 1\n")
	writeFile(filePathAsm, "	sub     rdx, rax\n")
	writeFile(filePathAsm, "	xor     eax, eax\n")
	writeFile(filePathAsm, "	lea     rsi, [rsp+32+rdx]\n")
	writeFile(filePathAsm, "	mov     rdx, r8\n")
	writeFile(filePathAsm, "	mov     rax, 1\n")
	writeFile(filePathAsm, "	syscall\n")
	writeFile(filePathAsm, "	add     rsp, 40\n")
	writeFile(filePathAsm, "	ret\n")
	writeFile(filePathAsm, "global _start\n")
	writeFile(filePathAsm, "_start:\n")
	for(i = 0; i < prog.length; i++){
		op = prog[i];
		assert(COUNT_OPS == 4, "Exhaustive handling of operations in compilation")
		if (op[0] == OP_PUSH){
			writeFile(filePathAsm, `	;; -- push ${op[1]} --\n`)
			writeFile(filePathAsm, `	push ${op[1]}\n`)
		} else
		if (op[0] == OP_PLUS){
			writeFile(filePathAsm, `	;; -- plus --\n`)
			writeFile(filePathAsm, `	pop rax\n`)
			writeFile(filePathAsm, `	pop rbx\n`)
			writeFile(filePathAsm, `	add rax, rbx\n`)
			writeFile(filePathAsm, `	push rax\n`)
		} else
		if (op[0] == OP_MINUS){
			writeFile(filePathAsm, `	;; -- minus --\n`)
			writeFile(filePathAsm, `	pop rax\n`)
			writeFile(filePathAsm, `	pop rbx\n`)
			writeFile(filePathAsm, `	sub rax, rbx\n`)
			writeFile(filePathAsm, `	push rax\n`)
		} else
		if (op[0] == OP_DUMP){
			writeFile(filePathAsm, `	;; -- dump --\n`)
			writeFile(filePathAsm, `	pop rdi\n`)
			writeFile(filePathAsm, `	call dump\n`)
		} else {
			assert(false, "unreachable");
		}
	}
		writeFile(filePathAsm, `	mov rax, 60\n`)
		writeFile(filePathAsm, `	mov rdi, 0\n`)
		writeFile(filePathAsm, `	syscall\n`)

		// asm compile
		await runCmd(`nasm -felf64 ${filePathAsm}`)
		await runCmd(`ld -o ${filePathExec} ${filePathObj}`)
		
		await runCmd(`chmod +x ${filePathExec}`)
}


async function runCmd(cmd) {
	console.log(`CMD: ${cmd}`)
	try {
		const { stdout, stderr } = await exec(cmd);
		if (stdout) console.log(stdout);
		if (stderr) console.log(stderr);
	} catch (e) {
		if (e) console.error(e); // should contain code (exit code) and signal (that caused the termination).
	}
}

let program=[
		fpush(34),
		fpush(35),
		plus(),
		dump()
	]


function usage(comp = "os"){
console.log(`USAGE: ${comp} <SUBCOMMAND> [ARGS]
SUBCOMMANDS:
	sim Simulate the program.
	com Compile the program.
`)

}

//program start
function main(){
	argv.shift()
	if (argv.length < 2){
		usage()
		console.log("ERROR: no subcommand provided")
		exit(1)
	}
	const compName = argv.shift()
	const subcommand = argv.shift()
	const filePath = argv.shift()
	if (subcommand == "sim"){
		simProg(program)
	} else
	if (subcommand == "com"){
		comProg(program, filePath)
	} else {
		console.log("ERROR:unknown command " + subcommand)
	}
} main()
